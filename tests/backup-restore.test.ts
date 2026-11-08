import { afterEach, expect, it } from 'vitest';
import { WatchlistDB, initializeCatalog, libraryRevision, saveBundle, setWatched, deleteShow, addImportSource } from '../src/db';
import { createBackup, restoreBackup } from '../src/backup';
import type { Backup, Bundle, Source } from '../src/model';

const when='2026-11-05T12:00:00Z';
const source:Source={id:'saved-source',name:'Original list',raw:'Fixture',importedAt:when,rows:[{id:'1',title:'Fixture',notes:'Source note',state:'imported',showId:10,season:1,sourceCategory:'Binge'}]};
const bundle:Bundle={show:{id:10,name:'Fixture',summary:null,status:'Running',genres:['Drama'],service:null,url:'https://www.tvmaze.com/shows/10',syncedAt:when},seasons:[{id:20,showId:10,number:1,episodeOrder:2,endDate:'2025-01-01'}],episodes:[1,2].map(number=>({id:number,showId:10,season:1,number,name:`Episode ${number}`,summary:null,airstamp:'2025-01-01T12:00:00Z',airdate:'2025-01-01',type:'regular'}))};
const empty:Backup={version:1,exportedAt:when,shows:[],seasons:[],episodes:[],progress:[],preferences:[],sources:[]};
const databases:WatchlistDB[]=[];
function create(){const db=new WatchlistDB(`restore-test-${crypto.randomUUID()}`);databases.push(db);return db;}
afterEach(async()=>{for(const db of databases) await db.delete();databases.length=0;});
async function fill(db:WatchlistDB){await saveBundle(bundle,db);await setWatched(1,true,db);await db.preferences.update(10,{notes:'Personal notes',order:7});await db.sources.put(source);}
const contents=({exportedAt,...data}:Backup)=>data;

it('round-trips metadata, watched state, personal notes, ordering and source history',async()=>{
  const original=create(),target=create();await fill(original);const backup=await createBackup(original);
  await saveBundle({show:{...bundle.show,id:99,name:'Replace this'},seasons:[],episodes:[]},target);
  await restoreBackup(backup,target);expect(contents(await createBackup(target))).toEqual(contents(backup));expect(await target.shows.get(99)).toBeUndefined();
  expect(await target.progress.get(1)).toEqual(backup.progress[0]);expect(await target.preferences.get(10)).toMatchObject({notes:'Personal notes',order:7});
});
it('rejects an invalid backup before changing any current records',async()=>{
  const db=create();await fill(db);const before=await createBackup(db);
  await expect(restoreBackup({...empty,version:99},db)).rejects.toThrow();expect(contents(await createBackup(db))).toEqual(contents(before));
});
it('rolls back all replacement writes if any table fails',async()=>{
  const original=create(),target=create();await fill(original);await saveBundle({show:{...bundle.show,id:99,name:'Keep this'},seasons:[],episodes:[]},target);await initializeCatalog({...source,id:'current-source',rows:[]},target);
  const before=await createBackup(target),revision=await libraryRevision(target);
  const fail=()=>{throw new Error('Simulated storage failure');};target.sources.hook('creating',fail);
  await expect(restoreBackup(await createBackup(original),target)).rejects.toThrow('Simulated');target.sources.hook('creating').unsubscribe(fail);
  expect(contents(await createBackup(target))).toEqual(contents(before));expect(await libraryRevision(target)).toBe(revision);
});
it('keeps an intentionally empty restore empty after reopening and startup initialization',async()=>{
  const db=create();await fill(db);await restoreBackup(empty,db);const name=db.name;db.close();const reopened=new WatchlistDB(name);databases.push(reopened);
  await initializeCatalog(source,reopened);expect(contents(await createBackup(reopened))).toEqual(contents({...empty,version:2}));expect((await reopened.settings.get('catalogInitialized'))?.value).toBe(true);
});
it('rejects stale metadata requests after restore but permits an explicit new import',async()=>{
  const db=create();await fill(db);const revision=await libraryRevision(db);await restoreBackup(empty,db);
  await expect(saveBundle(bundle,db,false,revision)).rejects.toThrow('restored');expect(await db.shows.count()).toBe(0);
  await saveBundle(bundle,db,false,await libraryRevision(db));expect(await db.shows.count()).toBe(1);
});
it('preserves historical episode records from a version-1 backup while resolving known ownership',async()=>{
  const db=create();await fill(db);const backup=await createBackup(db);backup.progress=[{episodeId:1,watchedAt:when},{episodeId:123,showId:10,watchedAt:when},{episodeId:124,watchedAt:when}];
  await restoreBackup(backup,db);expect(await db.progress.get(1)).toMatchObject({showId:10,watchedAt:when});expect(await db.progress.get(123)).toMatchObject({showId:10});expect(await db.progress.get(124)).toEqual({episodeId:124,watchedAt:when});
});
it('rejects a source file read before another tab restored the library',async()=>{
  const db=create();const revision=await libraryRevision(db);await restoreBackup(empty,db);
  await expect(addImportSource(source,revision,db)).rejects.toThrow('restored');expect(await db.sources.count()).toBe(0);
});
it('does not apply a pending legacy-history deletion to a newly restored library',async()=>{
  const db=create();await fill(db);const restored=await createBackup(db);restored.preferences[0].notes='Restored notes';await db.progress.put({episodeId:99,watchedAt:when});
  let release!:()=>void,started!:()=>void;const gate=new Promise<void>(resolve=>release=resolve),waiting=new Promise<void>(resolve=>started=resolve);
  const deleting=deleteShow(10,db,async()=>{started();await gate;return 10;});await waiting;await restoreBackup(restored,db);release();
  await expect(deleting).rejects.toThrow('restored');expect(contents(await createBackup(db))).toEqual(contents(restored));
});
