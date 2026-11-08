import {afterEach,describe,it,expect,vi} from 'vitest';
import {WatchlistDB,saveBundle,setWatched,deleteShow} from '../src/db';
import {createBackup,restoreBackup} from '../src/backup';
import {validateBackup} from '../src/backup-validation';
import {LibrarySync,type SyncTransport} from '../src/sync-engine';
import {readLocalSync,acceptSyncedState,syncAckConflictKey,readPendingUpload,acquirePendingUpload,clearPendingUpload,type PendingUpload} from '../src/sync-local';
import {libraryContentKey,type SharedLibrary} from '../src/sync-merge';
const databases:WatchlistDB[]=[],engines:LibrarySync[]=[];
function database(){const db=new WatchlistDB('sync-test-'+crypto.randomUUID());databases.push(db);return db;}
const bundle={show:{id:1,name:'Sync fixture',summary:null,status:'Ended',genres:[],service:null,url:'https://www.tvmaze.com/shows/1',syncedAt:'2026-01-01T00:00:00.000Z'},seasons:[{id:10,showId:1,number:1,episodeOrder:2,endDate:'2025-01-01'}],episodes:[1,2].map(id=>({id,showId:1,season:1,number:id,name:'Episode '+id,summary:null,airstamp:'2025-01-01T00:00:00.000Z',airdate:'2025-01-01',type:'regular'}))};
function remote(){
 let value:{revision:number;library:SharedLibrary}|null=null;
 const watchers=new Set<(revision:number)=>void>();
 const transport:SyncTransport={read:async()=>structuredClone(value),write:async(revision,library)=>{if((value?.revision??0)!==revision){const error=new Error('retry');error.name='CloudRevisionConflict';throw error;}value={revision:revision+1,library:structuredClone(library)};for(const watcher of watchers)queueMicrotask(()=>watcher(value!.revision));return value.revision;},watch:callback=>{watchers.add(callback);queueMicrotask(()=>callback(value?.revision??0));return()=>watchers.delete(callback);}};
 return {transport,get value(){return value;}};
}
function engine(db:WatchlistDB,transport:SyncTransport,online=()=>true){const instance=new LibrarySync(db,transport,()=>{},online);engines.push(instance);instance.start();return instance;}
afterEach(async()=>{for(const instance of engines.splice(0))instance.stop();for(const db of databases.splice(0))await db.delete();vi.restoreAllMocks();});
describe('durable shared-library synchronization',()=>{
 it('repairs a legacy blank date and merges pending edits without replacing either library',async()=>{
  const cloud=remote(),a=database(),b=database();await saveBundle(bundle,a);const first=engine(a,cloud.transport);
  await expect.poll(()=>cloud.value?.library.backup.shows.length).toBe(1);
  engine(b,cloud.transport);await expect.poll(()=>b.shows.count()).toBe(1);first.stop();
  await a.episodes.put({...bundle.episodes[0],id:3,season:3,number:1,airstamp:null,airdate:''});
  await a.preferences.update(1,{notes:'Unsynced notes preserved'});await setWatched(1,true,a);
  await setWatched(2,true,b);await expect.poll(()=>cloud.value?.library.backup.progress.some(p=>p.episodeId===2)).toBe(true);
  const phases:string[]=[];const resumed=new LibrarySync(a,cloud.transport,status=>phases.push(status.phase),()=>true);engines.push(resumed);resumed.start();
  await expect.poll(()=>b.episodes.get(3)).toMatchObject({airdate:null,airstamp:null});
  await expect.poll(()=>a.progress.count()).toBe(2);await expect.poll(()=>b.preferences.get(1)).toMatchObject({notes:'Unsynced notes preserved'});
  expect((await a.episodes.get(3))?.airdate).toBeNull();expect(phases).not.toContain('conflict');expect(phases).not.toContain('invalid');
 });
 it('accepts a legacy blank as unknown in backups but still rejects malformed calendar dates',async()=>{
  const db=database();await saveBundle(bundle,db);const backup=await createBackup(db);backup.episodes[0].airdate='';
  expect(validateBackup(backup).episodes[0].airdate).toBeNull();expect(backup.episodes[0].airdate).toBe('');
  for(const date of ['2026-02-30','2026-13-01',' ','tomorrow']){backup.episodes[0].airdate=date;expect(()=>validateBackup(backup)).toThrow('valid date');}
 });
 it('reports malformed saved data as invalid rather than a whole-library conflict',async()=>{
  const cloud=remote(),db=database();await saveBundle(bundle,db);await db.episodes.update(1,{airdate:'2026-02-30'});
  const phases:string[]=[];const instance=new LibrarySync(db,cloud.transport,status=>phases.push(status.phase),()=>true);engines.push(instance);instance.start();
  await expect.poll(()=>phases).toContain('invalid');expect(phases).not.toContain('conflict');expect(cloud.value).toBeNull();
  expect((await db.episodes.get(1))?.airdate).toBe('2026-02-30');
 });
 it('sends saved progress between two separate databases and survives an engine restart',async()=>{
  const cloud=remote(),a=database(),b=database();await saveBundle(bundle,a);const first=engine(a,cloud.transport);
  await expect.poll(()=>cloud.value?.library.backup.shows.length).toBe(1);
  engine(b,cloud.transport);await expect.poll(()=>b.shows.count()).toBe(1);
  first.stop();await setWatched(1,true,a); // Durable change while sync is stopped.
  engine(a,cloud.transport);await expect.poll(()=>b.progress.get(1)).toMatchObject({episodeId:1});
  await setWatched(1,false,b);await expect.poll(()=>a.progress.count()).toBe(0);
 });
 it('merges independent offline progress and notes on reconnect',async()=>{
  const cloud=remote(),a=database(),b=database();await saveBundle(bundle,a);engine(a,cloud.transport);await expect.poll(()=>cloud.value?.revision).toBeGreaterThan(0);
  let connected=true;const second=engine(b,cloud.transport,()=>connected);await expect.poll(()=>b.shows.count()).toBe(1);
  connected=false;await setWatched(1,true,b);await a.preferences.update(1,{notes:'From PC'});await expect.poll(()=>cloud.value?.library.backup.preferences[0].notes).toBe('From PC');
  connected=true;await second.sync();await expect.poll(()=>a.progress.get(1)).toBeDefined();await expect.poll(()=>b.preferences.get(1)).toMatchObject({notes:'From PC'});
 });
 it('does not resurrect a deleted show through stale offline edits',async()=>{
  const cloud=remote(),a=database(),b=database();await saveBundle(bundle,a);engine(a,cloud.transport);await expect.poll(()=>cloud.value?.revision).toBeGreaterThan(0);
  let connected=true;const second=engine(b,cloud.transport,()=>connected);await expect.poll(()=>b.shows.count()).toBe(1);
  connected=false;await setWatched(1,true,b);await deleteShow(1,a);await expect.poll(()=>cloud.value?.library.backup.shows.length).toBe(0);
  connected=true;await second.sync();expect(cloud.value?.library.backup.shows).toHaveLength(0);expect(await b.shows.count()).toBe(1); // Conflict preserves the local copy for explicit choice.
  await second.resolve('cloud');expect(await b.shows.count()).toBe(0);
 });
 it('applies a deliberate full restore but pauses conflicting edits from its old generation',async()=>{
  const cloud=remote(),a=database(),b=database();await saveBundle(bundle,a);engine(a,cloud.transport);await expect.poll(()=>cloud.value?.revision).toBeGreaterThan(0);
  let connected=true;const second=engine(b,cloud.transport,()=>connected);await expect.poll(()=>b.shows.count()).toBe(1);connected=false;
  await setWatched(1,true,b);const empty=await createBackup(database());await restoreBackup(empty,a);await expect.poll(()=>cloud.value?.library.backup.shows.length).toBe(0);
  connected=true;await second.sync();expect(await b.shows.count()).toBe(1);expect(cloud.value?.library.backup.shows).toHaveLength(0);
 });
 it('rejects a stale local apply instead of overwriting a newer check-off',async()=>{
  const a=database();await saveBundle(bundle,a);const before=(await readLocalSync(a)).current;await setWatched(1,true,a);
  expect(await acceptSyncedState(a,libraryContentKey(before),before,before,1)).toBe(false);expect(await a.progress.get(1)).toBeDefined();
 });
 it('creates a fresh lifecycle for a delete followed by re-add before synchronization',async()=>{
  const a=database();await saveBundle(bundle,a);const first=(await readLocalSync(a)).current.lifecycles['1'];await deleteShow(1,a);await saveBundle(bundle,a);
  expect((await readLocalSync(a)).current.lifecycles['1']).not.toBe(first);
 });
 it('rebases an undo made after upload commit but before its reply without losing the undo',async()=>{
  const cloud=remote(),a=database();await saveBundle(bundle,a);
  let release!:()=>void,started!:()=>void,blocked=false;
  const gate=new Promise<void>(resolve=>{release=resolve;}),waiting=new Promise<void>(resolve=>{started=resolve;});
  const transport:SyncTransport={...cloud.transport,write:async(revision,library)=>{
   const result=await cloud.transport.write(revision,library);
   if(!blocked&&library.backup.progress.some(p=>p.episodeId===1)){blocked=true;started();await gate;}
   return result;
  }};
  engine(a,transport);await expect.poll(async()=>(await readLocalSync(a)).revision).toBeGreaterThan(0);
  await setWatched(1,true,a);await waiting;expect(cloud.value?.library.backup.progress).toHaveLength(1);
  await setWatched(1,false,a);release();
  await expect.poll(()=>cloud.value?.library.backup.progress.length).toBe(0);
  await expect.poll(()=>a.progress.count()).toBe(0);
  await expect.poll(async()=>libraryContentKey((await readLocalSync(a)).current)===libraryContentKey((await readLocalSync(a)).base!)).toBe(true);
 });
 it('persists acknowledged rebase conflicts across engine restarts until an explicit choice',async()=>{
  const cloud=remote(),a=database();await saveBundle(bundle,a);
  let connected=true,release!:()=>void,started!:()=>void,blocked=false;
  const gate=new Promise<void>(resolve=>{release=resolve;}),waiting=new Promise<void>(resolve=>{started=resolve;});
  const transport:SyncTransport={...cloud.transport,write:async(revision,library)=>{
   const result=await cloud.transport.write(revision,library);
   if(!blocked&&library.backup.progress.length){blocked=true;started();await gate;}
   return result;
  }};
  const first=engine(a,transport,()=>connected);await expect.poll(async()=>(await readLocalSync(a)).revision).toBeGreaterThan(0);
  connected=false;await setWatched(1,true,a);
  const remoteEdit=structuredClone(cloud.value!);remoteEdit.library.backup.preferences[0].notes='Remote note';
  await cloud.transport.write(remoteEdit.revision,remoteEdit.library);
  connected=true;void first.sync();await waiting;
  await a.preferences.update(1,{notes:'Local note made during upload'});release();
  await expect.poll(async()=>typeof(await a.settings.get(syncAckConflictKey))?.value).toBe('string');
  expect((await readLocalSync(a)).base?.backup.preferences[0].notes).toBe('Remote note');
  expect((await a.preferences.get(1))?.notes).toBe('Local note made during upload');
  first.stop();const phases:string[]=[];
  const restarted=new LibrarySync(a,transport,status=>phases.push(status.phase),()=>true);engines.push(restarted);restarted.start();
  await expect.poll(()=>phases.includes('conflict')).toBe(true);
  expect(cloud.value?.library.backup.preferences[0].notes).toBe('Remote note');
  expect((await a.preferences.get(1))?.notes).toBe('Local note made during upload');
  await restarted.resolve('device');
  await expect.poll(()=>(a.settings.get(syncAckConflictKey))).toBeUndefined();
  expect(cloud.value?.library.backup.preferences[0].notes).toBe('Local note made during upload');
 });
 it.each([true,false])('recovers an interrupted upload after restart and preserves a later undo (server committed: %s)',async committed=>{
  const cloud=remote(),a=database();await saveBundle(bundle,a);
  let failed=false,interrupted!:()=>void;
  const waiting=new Promise<void>(resolve=>{interrupted=resolve;});
  const transport:SyncTransport={...cloud.transport,write:async(revision,library)=>{
   if(!failed&&library.backup.progress.length){failed=true;if(committed)await cloud.transport.write(revision,library);interrupted();throw new Error('Network reply lost');}
   return cloud.transport.write(revision,library);
  }};
  const first=engine(a,transport);await expect.poll(async()=>(await readLocalSync(a)).revision).toBeGreaterThan(0);
  await setWatched(1,true,a);await waiting;first.stop();
  const pending=await readPendingUpload(a);expect(pending?.published.backup.progress).toHaveLength(1);
  await setWatched(1,false,a);engine(a,transport);
  await expect.poll(()=>readPendingUpload(a)).toBeNull();
  await expect.poll(()=>cloud.value?.library.backup.progress.length).toBe(0);
  expect(await a.progress.count()).toBe(0);
  await expect.poll(async()=>libraryContentKey((await readLocalSync(a)).current)===libraryContentKey((await readLocalSync(a)).base!)).toBe(true);
 });
 it('clears a CAS-proven uncommitted intent and merges a different next server revision',async()=>{
  const cloud=remote(),a=database();await saveBundle(bundle,a);
  let failed=false,interrupted!:()=>void;const waiting=new Promise<void>(resolve=>{interrupted=resolve;});
  const transport:SyncTransport={...cloud.transport,write:async(revision,library)=>{
   if(!failed&&library.backup.progress.length){failed=true;interrupted();throw new Error('Request never reached server');}
   return cloud.transport.write(revision,library);
  }};
  const first=engine(a,transport);await expect.poll(async()=>(await readLocalSync(a)).revision).toBeGreaterThan(0);
  await setWatched(1,true,a);await waiting;first.stop();
  const intent=await readPendingUpload(a),other=structuredClone(cloud.value!);other.library.backup.preferences[0].notes='Independent server edit';
  expect(other.revision).toBe(intent?.expectedRevision);await cloud.transport.write(other.revision,other.library);
  engine(a,transport);await expect.poll(()=>cloud.value?.library.backup.progress.length).toBe(1);
  await expect.poll(()=>readPendingUpload(a)).toBeNull();
  expect(cloud.value?.library.backup.preferences[0].notes).toBe('Independent server edit');
 });
 it('durably pauses an ambiguous advanced server instead of discarding pending or local state',async()=>{
  const cloud=remote(),a=database();await saveBundle(bundle,a);
  let failed=false,interrupted!:()=>void;const waiting=new Promise<void>(resolve=>{interrupted=resolve;});
  const transport:SyncTransport={...cloud.transport,write:async(revision,library)=>{
   const result=await cloud.transport.write(revision,library);
   if(!failed&&library.backup.progress.length){failed=true;interrupted();throw new Error('Acknowledgement lost');}
   return result;
  }};
  const first=engine(a,transport);await expect.poll(async()=>(await readLocalSync(a)).revision).toBeGreaterThan(0);
  await setWatched(1,true,a);await waiting;first.stop();await setWatched(1,false,a);
  const pending=await readPendingUpload(a),other=structuredClone(cloud.value!);other.library.backup.preferences[0].notes='Server advanced again';
  await cloud.transport.write(other.revision,other.library);
  const phases:string[]=[],second=new LibrarySync(a,transport,status=>phases.push(status.phase),()=>true);engines.push(second);second.start();
  await expect.poll(()=>phases.includes('conflict')).toBe(true);
  expect((await readPendingUpload(a))?.id).toBe(pending?.id);expect(await a.progress.count()).toBe(0);
  expect(cloud.value?.library.backup.progress).toHaveLength(1);expect(typeof(await a.settings.get(syncAckConflictKey))?.value).toBe('string');
  second.stop();const restartPhases:string[]=[],third=new LibrarySync(a,transport,status=>restartPhases.push(status.phase),()=>true);engines.push(third);third.start();
  await expect.poll(()=>restartPhases.includes('conflict')).toBe(true);expect((await readPendingUpload(a))?.id).toBe(pending?.id);
  await third.resolve('cloud');expect(await readPendingUpload(a)).toBeNull();expect(await a.settings.get(syncAckConflictKey)).toBeUndefined();
 });
 it('acquires one pending intent across tabs and conditionally clears only that identity',async()=>{
  const a=database();await saveBundle(bundle,a);const captured=(await readLocalSync(a)).current;
  const first:PendingUpload={id:'intent-A',expectedRevision:0,captured,published:captured},second={...first,id:'intent-B'};
  const acquired=await Promise.all([acquirePendingUpload(a,first),acquirePendingUpload(a,second)]);
  expect(acquired[0].id).toBe(acquired[1].id);expect((await readPendingUpload(a))?.id).toBe(acquired[0].id);
  expect(await clearPendingUpload(a,'someone-elses-intent')).toBe(false);
  expect((await readPendingUpload(a))?.id).toBe(acquired[0].id);
  expect(await clearPendingUpload(a,acquired[0].id)).toBe(true);expect(await readPendingUpload(a)).toBeNull();
 });
 it('preflights oversized libraries before persisting intent and does not schedule automatic retries',async()=>{
  const cloud=remote(),a=database();await saveBundle(bundle,a);let writes=0;
  const statuses:string[]=[],timers=vi.spyOn(globalThis,'setTimeout');
  const transport:SyncTransport={...cloud.transport,validate:()=>{const error=new Error('Too large');error.name='CloudLibraryLimitError';throw error;},write:async()=>{writes++;return 1;}};
  const sync=new LibrarySync(a,transport,status=>statuses.push(status.message),()=>true);engines.push(sync);sync.start();
  await expect.poll(()=>statuses.includes('Library too large for this sync version. Your local library and backups are safe.')).toBe(true);
  expect(await readPendingUpload(a)).toBeNull();expect(writes).toBe(0);expect(timers.mock.calls.some(call=>call[1]===15000)).toBe(false);
 });
});
