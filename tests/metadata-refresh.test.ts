import {afterEach,expect,it} from 'vitest';
import {WatchlistDB,saveBundle,setWatched,deleteShow} from '../src/db';
import {metadataDue,metadataInterval,refreshDueMetadata} from '../src/metadata-refresh';
import {bucket,queue,type Bundle} from '../src/model';
const now=new Date('2026-11-08T18:00:00Z');
const bundle:Bundle={show:{id:10,name:'Returning fixture',summary:null,status:'Ended',genres:[],service:null,url:'https://www.tvmaze.com/shows/10',syncedAt:'2026-11-01T18:00:00Z'},seasons:[{id:20,showId:10,number:1,episodeOrder:1,endDate:'2025-01-01'}],episodes:[{id:30,showId:10,season:1,number:1,name:'Old episode',summary:null,type:'regular',airstamp:'2025-01-01T12:00:00Z',airdate:'2025-01-01'}]};
const updated:Bundle={...bundle,show:{...bundle.show,status:'Running'},seasons:[...bundle.seasons,{id:21,showId:10,number:2,episodeOrder:2,endDate:'2026-11-15'}],episodes:[...bundle.episodes,{...bundle.episodes[0],id:31,season:2,airstamp:'2026-11-08T12:00:00Z',airdate:'2026-11-08'},{...bundle.episodes[0],id:32,season:2,number:2,airstamp:'2026-11-15T12:00:00Z',airdate:'2026-11-15'}]};
const databases:WatchlistDB[]=[];
afterEach(async()=>{for(const database of databases)await database.delete();databases.length=0;});
async function fixture(){const database=new WatchlistDB('auto-refresh-'+crypto.randomUUID());databases.push(database);await saveBundle(bundle,database);return database;}
function options(fetch:()=>Promise<Bundle>=async()=>updated){return {now:()=>now,active:()=>true,pause:async()=>{},fetch};}

it('checks every status after 24 hours, including Ended/unknown and invalid clock timestamps',()=>{
  for(const status of ['Running','Ended','To Be Determined',null])expect(metadataDue({...bundle.show,status},now)).toBe(true);
  expect(metadataDue({...bundle.show,syncedAt:now.toISOString()},now)).toBe(false);
  expect(metadataDue({...bundle.show,syncedAt:now.toISOString()},new Date(+now+metadataInterval))).toBe(true);
  for(const syncedAt of ['invalid','2035-01-01T12:00:00Z'])expect(metadataDue({...bundle.show,syncedAt},now)).toBe(true);
});
it('discovers a returning season without changing notes, order, source history or watched timestamps',async()=>{
  const database=await fixture();await setWatched(30,true,database);const progress=await database.progress.toArray();
  await database.preferences.update(10,{notes:'My note',order:7});
  await database.sources.put({id:'source',name:'Original',raw:'Immutable source',importedAt:now.toISOString(),rows:[]});
  const source=await database.sources.toArray();
  await refreshDueMetadata(database,options(async()=>{await database.preferences.update(10,{notes:'Edit while checking'});return updated;}));
  expect(await database.progress.toArray()).toEqual(progress);expect(await database.sources.toArray()).toEqual(source);
  expect(await database.preferences.get(10)).toMatchObject({notes:'Edit while checking',order:7});
  const episodes=await database.episodes.toArray();
  expect(queue(episodes,progress,now).next?.id).toBe(31);
  expect(bucket(episodes,await database.seasons.toArray(),progress,now)).toBe('Weekly');
  let calls=0;await refreshDueMetadata(database,options(async()=>{calls++;return updated;}));expect(calls).toBe(0);
});
it('does not fetch offline/paused and discards a result if the app pauses during its request',async()=>{
  const database=await fixture();let active=false,calls=0;
  const opts={...options(async()=>{calls++;active=false;return updated;}),active:()=>active};
  await refreshDueMetadata(database,opts);expect(calls).toBe(0);
  active=true;await refreshDueMetadata(database,opts);expect(calls).toBe(1);expect(await database.shows.get(10)).toEqual(bundle.show);
});
for(const change of ['restore','re-add','newer refresh','conflict'] as const)it(`discards stale metadata after ${change}`,async()=>{
  const database=await fixture();
  await refreshDueMetadata(database,options(async()=>{
    if(change==='restore')await database.settings.put({key:'libraryRevision',value:'restored'});
    if(change==='re-add'){await deleteShow(10,database);await saveBundle(bundle,database);}
    if(change==='newer refresh')await database.shows.update(10,{syncedAt:now.toISOString()});
    if(change==='conflict')await database.settings.put({key:'syncAckConflict',value:'Paused conflict'});
    return updated;
  }));
  expect(await database.episodes.count()).toBe(1);expect((await database.shows.get(10))?.status).toBe('Ended');
});
it('retains the complete snapshot on failure and persists retry backoff across runs',async()=>{
  const database=await fixture();let calls=0;
  const opts=options(async()=>{calls++;throw new Error('429');});
  await refreshDueMetadata(database,opts);await refreshDueMetadata(database,opts);
  expect(calls).toBe(1);expect(await database.shows.get(10)).toEqual(bundle.show);expect(await database.episodes.count()).toBe(1);
  await refreshDueMetadata(database,{...options(),now:()=>new Date(+now+60*60*1000)});
  expect(await database.episodes.count()).toBe(3);
});
it('leases across concurrent workers and releases the lease after finishing',async()=>{
  const database=await fixture();let resolve!:(value:Bundle)=>void,started!:()=>void;
  const entered=new Promise<void>(r=>{started=r;});const pending=new Promise<Bundle>(r=>{resolve=r;});
  const first=refreshDueMetadata(database,options(async()=>{started();return pending;}));await entered;
  let duplicate=0;await refreshDueMetadata(database,options(async()=>{duplicate++;return updated;}));expect(duplicate).toBe(0);
  resolve(updated);await first;expect(await database.settings.get('metadataRefreshLease')).toBeUndefined();
});
it('rejects mismatched provider identities without relinking the show',async()=>{
  const database=await fixture();await refreshDueMetadata(database,options(async()=>({...updated,show:{...updated.show,id:999}})));
  expect(await database.shows.count()).toBe(1);expect(await database.episodes.count()).toBe(1);
});
it('keeps the old snapshot when provider metadata is incomplete',async()=>{
  const database=await fixture();
  await refreshDueMetadata(database,options(async()=>({...updated,episodes:[{...updated.episodes[0],airdate:'not-a-date'}]})));
  expect(await database.shows.get(10)).toEqual(bundle.show);expect(await database.episodes.count()).toBe(1);
});
it('does not overwrite episode identifiers belonging to another tracked show',async()=>{
  const database=await fixture();
  await saveBundle({show:{...bundle.show,id:11,syncedAt:now.toISOString()},seasons:[],episodes:[{...bundle.episodes[0],id:31,showId:11}]},database);
  await refreshDueMetadata(database,options());
  expect((await database.episodes.get(31))?.showId).toBe(11);expect((await database.shows.get(10))?.status).toBe('Ended');
});
