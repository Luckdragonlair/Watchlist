import {saveBingeOrder,type OrderSnapshot} from '../src/binge-order';
import {lastBingeActivity} from '../src/binge-model';
import {libraryRevision} from '../src/db';
import {readFile} from 'node:fs/promises';
import {beforeAll,beforeEach,afterEach,afterAll,describe,it,expect} from 'vitest';
import {initializeTestEnvironment,type RulesTestEnvironment} from '@firebase/rules-unit-testing';
import {doc,getDoc,setDoc,disableNetwork,enableNetwork,type Firestore} from 'firebase/firestore';
import {WatchlistDB,saveBundle,setWatched,deleteShow} from '../src/db';
import {restoreBackup,createBackup} from '../src/backup';
import {LibrarySync,type SyncStatus} from '../src/sync-engine';
import {readRemote,writeRemote,watchRemote,CloudRevisionConflict} from '../src/cloud-transport';
import {readLocalSync} from '../src/sync-local';
const match=/^(127\.0\.0\.1|localhost):(\d+)$/.exec(process.env.FIRESTORE_EMULATOR_HOST??'');
if(!match)throw new Error('Integration tests require the loopback Firestore emulator.');
const uid='6FpyLI0bEFaPJBTUboMz0MzTpMV2';
let environment:RulesTestEnvironment;
const databases:WatchlistDB[]=[],engines:LibrarySync[]=[];
const fixture={show:{id:1,name:'Sync fixture',summary:null,status:'Ended',genres:[],service:null,url:'https://www.tvmaze.com/shows/1',syncedAt:'2026-01-01T00:00:00.000Z'},seasons:[{id:10,showId:1,number:1,episodeOrder:2,endDate:'2025-01-01'}],episodes:[1,2].map(id=>({id,showId:1,season:1,number:id,name:'Episode '+id,summary:null,airstamp:'2025-01-01T00:00:00.000Z',airdate:'2025-01-01',type:'regular'}))};
function database(){const db=new WatchlistDB('integration-'+crypto.randomUUID());databases.push(db);return db;}
function firestore(){return environment.authenticatedContext(uid).firestore() as unknown as Firestore;}
const poll=<T>(fn:()=>T|Promise<T>)=>expect.poll(fn,{timeout:15000,interval:100});
function engine(db:WatchlistDB,cloud:Firestore,online=()=>true){
  let status:SyncStatus={phase:'checking',message:''};
  const instance=new LibrarySync(db,{read:()=>readRemote(cloud,uid),write:(revision,library)=>writeRemote(cloud,uid,revision,library),watch:(changed,error)=>watchRemote(cloud,uid,changed,error)},next=>{status=next;},online);
  engines.push(instance);instance.start();return {instance,get status(){return status;}};
}
beforeAll(async()=>{environment=await initializeTestEnvironment({projectId:'demo-watchlist-rules',firestore:{host:match[1],port:Number(match[2]),rules:await readFile('firestore.rules','utf8')}});});
beforeEach(async()=>{await environment.clearFirestore();});
afterEach(async()=>{for(const instance of engines.splice(0))instance.stop();for(const db of databases.splice(0))await db.delete();});
afterAll(async()=>{await environment.cleanup();});
describe('Firestore transport and two-device synchronization',()=>{
  it('creates, reads and compare-and-swaps the first cloud library',async()=>{
    const local=database();await saveBundle(fixture,local);const snapshot=(await readLocalSync(local)).current,cloud=firestore();
    expect(await readRemote(cloud,uid)).toBeNull();expect(await writeRemote(cloud,uid,0,snapshot)).toBe(1);
    expect((await readRemote(cloud,uid))?.library.backup.shows[0].name).toBe('Sync fixture');
    await expect(writeRemote(cloud,uid,0,snapshot)).rejects.toBeInstanceOf(CloudRevisionConflict);
  });
  it('round-trips multiple UTF-8 chunks and rejects corrupted cloud payloads',async()=>{
    const local=database();await saveBundle(fixture,local);const snapshot=(await readLocalSync(local)).current;
    snapshot.backup.preferences[0].notes='漢字🙂'.repeat(110000);const cloud=firestore();
    await writeRemote(cloud,uid,0,snapshot);expect((await readRemote(cloud,uid))?.library.backup.preferences[0].notes).toBe(snapshot.backup.preferences[0].notes);
    await environment.withSecurityRulesDisabled(async context=>{await setDoc(doc(context.firestore() as unknown as Firestore,'users',uid,'sync','library'),{payloadHash:'0'.repeat(64)},{merge:true});});
    await expect(readRemote(cloud,uid)).rejects.toThrow('checksum');
  });
  it('rejects an oversized upload before modifying the existing cloud revision',async()=>{
    const local=database();await saveBundle(fixture,local);const snapshot=(await readLocalSync(local)).current,cloud=firestore();
    await writeRemote(cloud,uid,0,snapshot);snapshot.backup.preferences[0].notes='x'.repeat(6_000_001);
    await expect(writeRemote(cloud,uid,1,snapshot)).rejects.toThrow('6 MB');expect((await readRemote(cloud,uid))?.revision).toBe(1);
  });
  it('syncs progress both ways, merges offline notes, and propagates deletion without resurrection',async()=>{
    const a=database(),b=database(),cloudA=firestore(),cloudB=firestore();await saveBundle(fixture,a);
    const first=engine(a,cloudA);await poll(()=>first.status.phase).toBe('saved');
    let connected=true;const second=engine(b,cloudB,()=>connected);await poll(()=>b.shows.count()).toBe(1);
    await setWatched(1,true,a);await poll(()=>b.progress.get(1)).toBeDefined();
    connected=false;await disableNetwork(cloudB);await b.preferences.update(1,{notes:'Phone offline note'});await setWatched(2,true,a);await poll(async()=>(await readRemote(cloudA,uid))?.library.backup.progress.length).toBe(2);
    connected=true;await enableNetwork(cloudB);await second.instance.sync();
    await poll(()=>a.preferences.get(1)).toMatchObject({notes:'Phone offline note'});await poll(()=>b.progress.count()).toBe(2);
    connected=false;await disableNetwork(cloudB);await setWatched(1,false,b);await deleteShow(1,a);await poll(async()=>(await readRemote(cloudA,uid))?.library.backup.shows.length).toBe(0);
    connected=true;await enableNetwork(cloudB);await second.instance.sync();await poll(()=>second.status.phase).toBe('conflict');
    expect((await readRemote(cloudA,uid))?.library.backup.shows).toHaveLength(0);expect(await b.shows.count()).toBe(1);
    await second.instance.resolve('cloud');await poll(()=>b.shows.count()).toBe(0);
  });
  it('syncs explicit backup replacement as a new generation',async()=>{
    const a=database(),b=database(),cloudA=firestore(),cloudB=firestore();await saveBundle(fixture,a);const first=engine(a,cloudA);await poll(()=>first.status.phase).toBe('saved');
    engine(b,cloudB);await poll(()=>b.shows.count()).toBe(1);const before=(await readRemote(cloudA,uid))!.library.epoch;
    await restoreBackup(await createBackup(database()),a);await poll(()=>b.shows.count()).toBe(0);
    expect((await readRemote(cloudA,uid))!.library.epoch).not.toBe(before);
  });
});

it('synchronizes format-3 manual order and Recent reset between private devices without losing notes',async()=>{
 const a=database(),b=database(),cloudA=firestore(),cloudB=firestore();
 await saveBundle(fixture,a);await saveBundle({...fixture,show:{...fixture.show,id:2,name:'Other sync fixture'},seasons:[{...fixture.seasons[0],id:20,showId:2}],episodes:fixture.episodes.map((e,i)=>({...e,id:3+i,showId:2}))},a);
 for(const id of [1,2])await a.preferences.update(id,{bingeSection:'watch-soon',order:id});await setWatched(1,true,a);await setWatched(3,true,a);
 const first=engine(a,cloudA);await poll(()=>first.status.phase).toBe('saved');engine(b,cloudB);await poll(()=>b.shows.count()).toBe(2);
 async function capture():Promise<OrderSnapshot>{const episodes=await a.episodes.toArray(),progress=await a.progress.toArray();return {revision:await libraryRevision(a),section:'watching-now',started:true,members:await Promise.all([1,2].map(async id=>{const p=(await a.preferences.get(id))!;return {id,order:p.order,life:String((await a.settings.get('syncLife:'+id))?.value??''),activity:lastBingeActivity(episodes.filter(e=>e.showId===id),progress),manual:!!p.bingeManualOrder,storedSection:p.bingeSection};}))};}
 await saveBingeOrder(await capture(),[2,1],a);await poll(()=>b.preferences.get(2)).toMatchObject({order:0,bingeManualOrder:true});expect((await readRemote(cloudA,uid))?.library.backup.version).toBe(3);
 await b.preferences.update(1,{notes:'Family-independent device note'});await poll(()=>a.preferences.get(1)).toMatchObject({notes:'Family-independent device note'});
 await saveBingeOrder(await capture(),[2,1],a,new Date(),false);await poll(()=>b.preferences.get(1)).toMatchObject({bingeManualOrder:false,notes:'Family-independent device note'});
});
