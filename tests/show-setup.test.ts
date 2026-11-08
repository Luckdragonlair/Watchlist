import {afterEach,expect,it} from 'vitest';
import {WatchlistDB,saveBundle,setWatched,deleteShow} from '../src/db';
import {loadShowSetup,saveShowSetup} from '../src/show-setup';
import {queue,type Bundle,type Episode} from '../src/model';
const now=new Date('2026-11-07T18:00:00Z');
const episode=(id:number,season:number,number:number,stamp:string|null='2025-01-01T12:00:00Z'):Episode=>({id,showId:1,season,number,name:`Episode ${number}`,summary:null,type:'regular',airstamp:stamp,airdate:stamp?.slice(0,10)??null});
const bundle:Bundle={show:{id:1,name:'Setup fixture',summary:null,status:'Running',genres:[],service:null,url:'https://www.tvmaze.com/shows/1',syncedAt:now.toISOString()},seasons:[],episodes:[episode(11,1,1),episode(12,1,2),episode(13,1,3,null),{...episode(14,1,4),type:'significant_special'},episode(21,2,1),episode(22,2,2),episode(31,3,1,'2035-01-01T12:00:00Z')]};
const databases:WatchlistDB[]=[];
afterEach(async()=>{for(const database of databases)await database.delete();databases.length=0;});
async function fixture(){const database=new WatchlistDB('setup-test-'+crypto.randomUUID());databases.push(database);await saveBundle(bundle,database);await database.preferences.update(1,{notes:'Existing source notes',order:7});return database;}

it('saves notes and explicit earlier released progress atomically without changing current, future, special or unknown episodes',async()=>{
  const database=await fixture();await setWatched(11,true,database);const original=await database.progress.get(11);
  await saveShowSetup(await loadShowSetup(1,database),'My personal note',22,now,database);
  expect((await database.progress.toArray()).map(p=>p.episodeId).sort()).toEqual([11,12,21]);
  expect(await database.progress.get(11)).toEqual(original);
  expect(await database.preferences.get(1)).toMatchObject({notes:'My personal note',order:7});
});
it('allows notes-only setup and preserves already-watched selected episodes',async()=>{
  const database=await fixture();await setWatched(22,true,database);const progress=await database.progress.toArray();
  await saveShowSetup(await loadShowSetup(1,database),'Notes only',undefined,now,database);
  expect(await database.progress.toArray()).toEqual(progress);
  await saveShowSetup(await loadShowSetup(1,database),'Notes only',22,now,database);
  expect(await database.progress.get(22)).toEqual(progress[0]);
});
it('caught up preserves tracking and timestamps, excludes future/special/unknown releases and queues later releases',async()=>{
  const database=await fixture();await setWatched(11,true,database);const original=await database.progress.get(11);
  const show=await database.shows.get(1), seasons=await database.seasons.toArray();
  await database.episodes.bulkPut([{...episode(41,4,1,null),airdate:'2026-11-07'},{...episode(42,4,2,null),airdate:'2026-11-06'}]);
  await saveShowSetup(await loadShowSetup(1,database),'Caught up note','caught-up',now,database);
  expect((await database.progress.toArray()).map(p=>p.episodeId).sort()).toEqual([11,12,21,22,42]);
  expect(await database.progress.get(11)).toEqual(original);
  expect(await database.shows.get(1)).toEqual(show);expect(await database.seasons.toArray()).toEqual(seasons);
  expect(await database.preferences.get(1)).toMatchObject({notes:'Caught up note',order:7});
  const watched=await database.progress.toArray();
  expect(queue(await database.episodes.toArray(),watched,now).next).toBeUndefined();
  expect(queue(bundle.episodes,watched,new Date('2035-01-02T12:00:00Z')).next?.id).toBe(31);
});
it('caught up refuses stale notes without partially writing progress',async()=>{
  const database=await fixture(),snapshot=await loadShowSetup(1,database);await database.preferences.update(1,{notes:'Phone edit'});
  await expect(saveShowSetup(snapshot,'PC draft','caught-up',now,database)).rejects.toThrow('Saved notes changed');
  expect(await database.progress.count()).toBe(0);
});
it('rejects a bad episode without saving notes or any earlier progress',async()=>{
  const database=await fixture();await expect(saveShowSetup(await loadShowSetup(1,database),'Bad edit',999,now,database)).rejects.toThrow('current episode');
  expect(await database.progress.count()).toBe(0);expect((await database.preferences.get(1))?.notes).toBe('Existing source notes');
});
it('refuses to overwrite newer notes and leaves progress unchanged',async()=>{
  const database=await fixture(), snapshot=await loadShowSetup(1,database);await database.preferences.update(1,{notes:'Phone edit'});
  await expect(saveShowSetup(snapshot,'PC draft',22,now,database)).rejects.toThrow('Saved notes changed');
  expect((await database.preferences.get(1))?.notes).toBe('Phone edit');expect(await database.progress.count()).toBe(0);
});
it('refuses a stale setup after restore or deletion/re-add',async()=>{
  const database=await fixture(), snapshot=await loadShowSetup(1,database);
  await database.settings.put({key:'libraryRevision',value:'new-restored-library'});
  await expect(saveShowSetup(snapshot,'Old draft',22,now,database)).rejects.toThrow('restored or synchronized');
  const afterRestore=await loadShowSetup(1,database);await deleteShow(1,database);await saveBundle(bundle,database);
  await expect(saveShowSetup(afterRestore,'Old show draft',22,now,database)).rejects.toThrow('removed or replaced');
  expect(await database.progress.count()).toBe(0);expect((await database.preferences.get(1))?.notes).toBe('');
});
