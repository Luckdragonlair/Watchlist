import { describe, expect, it, afterEach } from 'vitest';
import Dexie from 'dexie';
import { WatchlistDB, saveBundle, setWatched, onboard, deleteShow } from '../src/db';
import { airTime, bucket, confirmedComplete, queue, released, weeklyRelease, type Bundle, type Episode } from '../src/model';
import { prepareSource } from '../src/importer';
import { createBackup } from '../src/backup';
const now = new Date('2026-11-05T12:00:00Z');
const ep = (id: number, season = 1, number = id, airstamp: string | null = '2025-01-01T12:00:00Z'): Episode => ({id,showId:10,season,number,name:`Episode ${number}`,summary:null,airstamp,airdate:airstamp?.slice(0,10) ?? null,type:'regular'});
const bundle = (): Bundle => ({show:{id:10,name:'Test series',summary:null,status:'Running',genres:[],service:null,url:'https://www.tvmaze.com/shows/10',syncedAt:now.toISOString()},seasons:[{id:20,showId:10,number:1,episodeOrder:2,endDate:'2025-01-01'}],episodes:[ep(1),ep(2)]});
describe('release and queue rules', () => {
  it('checks only one episode and does not backfill skipped episodes', () => {
    expect(queue([ep(1),ep(2),ep(3)], [{episodeId:2,watchedAt:now.toISOString()}], now).next?.id).toBe(1);
    expect(queue([ep(1),ep(2),ep(3)], [{episodeId:1,watchedAt:now.toISOString()}], now).next?.id).toBe(2);
  });
  it('excludes future, unknown and special episodes from the available count', () => {
    const q = queue([ep(1),ep(2,1,2,'2027-01-01T12:00:00Z'),ep(3,1,3,null),{...ep(4),type:'significant_special',number:null}],[],now);
    expect(q.available.map(e=>e.id)).toEqual([1]); expect(q.upcoming).toHaveLength(1); expect(q.unknown).toHaveLength(1);
  });
  it('does not infer exact release time from a date-only entry', () => {
    expect(released({...ep(1,1,1,null),airdate:'2026-11-05'},now)).toBe(false);
    expect(released({...ep(1,1,1,null),airdate:'2026-11-04'},now)).toBe(true);
  });
  it('handles Central Time across daylight-saving changes', () => {
    expect(airTime('2026-07-01T01:00:00Z')).toContain('8:00 PM CDT');
    expect(airTime('2026-11-05T02:00:00Z')).toContain('8:00 PM CST');
  });
  it('requires season ending and expected count before reporting completion', () => {
    const b=bundle(), progress=b.episodes.map(e=>({episodeId:e.id,watchedAt:now.toISOString()}));
    expect(confirmedComplete(b.seasons[0],b.episodes,progress,now)).toBe(true);
    expect(confirmedComplete({...b.seasons[0],episodeOrder:null},b.episodes,progress,now)).toBe(false);
    expect(confirmedComplete({...b.seasons[0],episodeOrder:3},b.episodes,progress,now)).toBe(false);
    expect(confirmedComplete({...b.seasons[0],endDate:null},b.episodes,progress,now)).toBe(false);
    expect(confirmedComplete({...b.seasons[0],endDate:'2026-11-05'},[ep(1,1,1,'2026-11-05T10:00:00Z'),ep(2,1,2,'2026-11-05T11:00:00Z')],progress,now)).toBe(true);
  });
  it('separates weekly, binge, and confirmed watched items', () => {
    const b=bundle(); expect(bucket(b.episodes,b.seasons,[],now)).toBe('Binge');
    expect(bucket([...b.episodes,ep(3,1,3,'2027-01-01T12:00:00Z')],b.seasons,[],now)).toBe('Weekly');
    expect(bucket(b.episodes,b.seasons,b.episodes.map(e=>({episodeId:e.id,watchedAt:now.toISOString()})),now)).toBe('Watched');
  });
  it('keeps a released backlog season in Binge when a later season has a future premiere',()=>{
    const episodes=[ep(8,3,8),ep(9,3,9),ep(10,3,10),ep(11,4,1,'2027-07-09T12:00:00Z')];
    expect(bucket(episodes,[],[],now)).toBe('Binge');
    expect(weeklyRelease(episodes,[],now)).toBeUndefined();
    expect(queue(episodes,[],now).next?.number).toBe(8);
    expect(queue(episodes,[],now).available).toHaveLength(3);
  });
  it('uses the current season release for Weekly grouping instead of a later-season date',()=>{
    const current=ep(9,3,9,'2026-11-10T12:00:00Z');
    const episodes=[ep(8,3,8),ep(11,4,1,'2026-11-06T12:00:00Z'),current];
    expect(bucket(episodes,[],[],now)).toBe('Weekly');
    expect(weeklyRelease(episodes,[],now)?.id).toBe(current.id);
  });
  it('keeps an unstarted future season out of Weekly even when caught up',()=>{
    const episodes=[ep(8,3,8),ep(9,3,9),ep(10,3,10),ep(11,4,1,'2027-07-09T12:00:00Z')];
    const progress=episodes.slice(0,3).map(e=>({episodeId:e.id,watchedAt:now.toISOString()}));
    expect(bucket(episodes,[],progress,now)).toBe('Binge');
    expect(weeklyRelease(episodes,progress,now)).toBeUndefined();
  });
  it('moves a new season into Weekly only after it starts releasing',()=>{
    const episodes=[ep(11,4,1,'2026-11-06T12:00:00Z'),ep(12,4,2,'2026-11-13T12:00:00Z')];
    expect(bucket(episodes,[],[],now)).toBe('Binge');
    const duringSeason=new Date('2026-11-07T12:00:00Z');
    expect(bucket(episodes,[],[],duringSeason)).toBe('Weekly');
    const watched=[{episodeId:11,watchedAt:duringSeason.toISOString()}];
    expect(bucket(episodes,[],watched,duringSeason)).toBe('Weekly');
    expect(weeklyRelease(episodes,watched,duringSeason)?.number).toBe(2);
  });
});
describe('master working copy', () => {
  it('keeps original source and excludes all Silo installments', () => {
    const raw='Silo\nSilo S2\nSILO Season 4\nSeverance\nRe S3\nRe S4'; const source=prepareSource('list.txt',raw);
    expect(source.raw).toBe(raw); expect(source.rows.map(r=>r.state)).toEqual(['excluded','excluded','excluded','pending','review','review']);
  });
  it('retains notes and rejects malformed rows atomically', () => {
    expect(prepareSource('list.json',JSON.stringify([{title:'Test',notes:'Unverified S3 guess'}])).rows[0].notes).toBe('Unverified S3 guess');
    expect(()=>prepareSource('list.json','["Good", 123]')).toThrow('Row 2');
  });
});
describe('IndexedDB persistence and sync', () => {
  const databases: WatchlistDB[]=[];
  const create = (name=`watchlist-test-${crypto.randomUUID()}`) => {const db=new WatchlistDB(name); databases.push(db); return db;};
  afterEach(async()=>{for(const db of databases) await db.delete(); databases.length=0;});
  it('persists progress across closing and reopening the database',async()=>{
    const db=create(); await saveBundle(bundle(),db); await setWatched(1,true,db); const name=db.name; db.close();
    const reopened=create(name); expect(await reopened.progress.get(1)).toBeDefined(); expect(await reopened.shows.count()).toBe(1);
  });
  it('exports all library records and progress without changing them',async()=>{
    const db=create();const b=bundle();await saveBundle(b,db);await setWatched(1,true,db);await db.preferences.update(10,{notes:'Preserve these notes',order:4});
    const source={id:'backup-source',name:'Working list',raw:'Test series',importedAt:now.toISOString(),rows:[{id:'1',title:'Test series',notes:'source assertion',state:'imported' as const,showId:10}]};await db.sources.put(source);
    const progress=await db.progress.toArray();const backup=await createBackup(db);
    expect(backup).toMatchObject({version:2,shows:[b.show],seasons:b.seasons,episodes:b.episodes,progress,sources:[source],preferences:[{showId:10,notes:'Preserve these notes',order:4}]});
    expect(Number.isFinite(Date.parse(backup.exportedAt))).toBe(true);expect(await db.progress.toArray()).toEqual(progress);expect(await db.shows.toArray()).toEqual([b.show]);
  });
  it('syncs twice without duplicates or overwriting progress and manual preferences',async()=>{
    const db=create(); const b=bundle(); await saveBundle(b,db); await setWatched(1,true,db); await db.preferences.update(10,{notes:'My notes',order:9});
    await saveBundle({...b,show:{...b.show,name:'Updated title'}},db); await saveBundle(b,db);
    expect(await db.episodes.count()).toBe(2); expect(await db.seasons.count()).toBe(1); expect(await db.progress.get(1)).toBeDefined(); expect(await db.preferences.get(10)).toMatchObject({notes:'My notes',order:9});
  });
  it('supports an explicit mid-season start and undo without marking current/future watched',async()=>{
    const db=create(); const b=bundle(); b.episodes=[...Array.from({length:10},(_,i)=>ep(i+1,1,i+1)),...Array.from({length:10},(_,i)=>ep(i+11,2,i+1)),ep(30,3,1,'2027-01-01T12:00:00Z')];
    await saveBundle(b,db); await onboard(10,18,now,db); expect(await db.progress.count()).toBe(17); expect(await db.progress.get(18)).toBeUndefined(); expect(await db.progress.get(30)).toBeUndefined();
    expect(queue(b.episodes,await db.progress.toArray(),now).next?.number).toBe(8);
    await setWatched(18,true,db); expect(queue(b.episodes,await db.progress.toArray(),now).next?.number).toBe(9);
    await setWatched(18,false,db); expect(queue(b.episodes,await db.progress.toArray(),now).next?.number).toBe(8);
  });
  it('rolls back an invalid metadata transaction',async()=>{
    const db=create(); const b=bundle(); await expect(saveBundle({...b,episodes:[{...ep(1),id:undefined as unknown as number}]},db)).rejects.toThrow();
    expect(await db.shows.count()).toBe(0); expect(await db.episodes.count()).toBe(0);
  });
  it('replaces retracted provider metadata while preserving orphan viewing history',async()=>{
    const db=create(); const b=bundle(); await saveBundle(b,db); await setWatched(2,true,db);
    await saveBundle({...b,episodes:[ep(1)]},db); expect(await db.episodes.count()).toBe(1); expect(await db.progress.get(2)).toBeDefined();
    await saveBundle(b,db); expect(await db.progress.get(2)).toBeDefined();
  });
  it('deletes the whole show including retracted-episode history, aliases and source rows, keeping other shows',async()=>{
    const db=create(); const first=bundle(); await saveBundle(first,db); await setWatched(1,true,db); await setWatched(2,true,db);
    await saveBundle({...first,episodes:[ep(1)]},db);
    const second={show:{...first.show,id:11,name:'Keep this show'},seasons:[{...first.seasons[0],id:21,showId:11}],episodes:[{...ep(3),showId:11}]};
    await saveBundle(second,db);await setWatched(3,true,db);
    await db.sources.put({id:'test-source',name:'Working source',raw:'Deleted source title\nTest series\nKeep this show',importedAt:now.toISOString(),rows:[{id:'1',title:'Deleted source title',notes:'delete notes',state:'imported',showId:10},{id:'2',title:'Deleted source title',notes:'',state:'pending'},{id:'3',title:'Test series',notes:'',state:'pending'},{id:'4',title:'Keep this show',notes:'keep notes',state:'imported',showId:11},{id:'5',title:'Test series',notes:'same name, different positively selected show',state:'imported',showId:11}]});
    await deleteShow(10,db);
    expect(await db.shows.toArray()).toEqual([second.show]);expect(await db.episodes.toArray()).toEqual(second.episodes);expect(await db.seasons.toArray()).toEqual(second.seasons);
    expect((await db.progress.toArray()).map(p=>p.episodeId)).toEqual([3]);expect((await db.preferences.toArray()).map(p=>p.showId)).toEqual([11]);
    const source=await db.sources.get('test-source');expect(source?.rows.map(r=>r.id)).toEqual(['3','4','5']);expect(source?.raw).not.toContain('delete notes');expect(source?.raw).not.toContain('Deleted source title');
    await expect(setWatched(1,true,db)).rejects.toThrow('no longer exists');
    await expect(saveBundle(first,db,true)).rejects.toThrow('deleted');
    expect(await db.shows.get(10)).toBeUndefined();
  });
  it('retains an empty source marker after deleting its final title so reload cannot restore its seed',async()=>{
    const db=create();await saveBundle(bundle(),db);
    await db.sources.put({id:'seed',name:'Seed',raw:'Test series',importedAt:now.toISOString(),rows:[{id:'1',title:'Test series',notes:'',state:'pending'}]});
    await deleteShow(10,db);expect(await db.sources.get('seed')).toMatchObject({rows:[],raw:'[]'});
    await deleteShow(10,db);expect(await db.shows.count()).toBe(0);
  });
  it('upgrades existing progress without losing viewing state and assigns show ownership',async()=>{
    const name=`watchlist-upgrade-${crypto.randomUUID()}`;
    const legacy=new Dexie(name);legacy.version(1).stores({shows:'id, name',seasons:'id, showId',episodes:'id, showId, [showId+season]',progress:'episodeId',preferences:'showId, order',sources:'id'});
    await legacy.table('shows').put(bundle().show);await legacy.table('episodes').bulkPut(bundle().episodes);await legacy.table('progress').put({episodeId:1,watchedAt:now.toISOString()});legacy.close();
    const db=create(name);expect(await db.progress.get(1)).toEqual({episodeId:1,showId:10,watchedAt:now.toISOString()});
    await deleteShow(10,db);expect(await db.progress.count()).toBe(0);
  });
  it('rolls back every part of deletion if removing a source fails',async()=>{
    const db=create();await saveBundle(bundle(),db);await setWatched(1,true,db);
    await db.sources.put({id:'blocked-source',name:'Source',raw:'Test series',importedAt:now.toISOString(),rows:[{id:'1',title:'Test series',notes:'',state:'imported',showId:10}]});
    const rejectDelete=()=>{throw new Error('Simulated source write failure');};
    db.sources.hook('updating',rejectDelete);
    await expect(deleteShow(10,db)).rejects.toThrow('Simulated');
    db.sources.hook('updating').unsubscribe(rejectDelete);
    expect(await db.shows.count()).toBe(1);expect(await db.episodes.count()).toBe(2);expect(await db.progress.count()).toBe(1);expect(await db.preferences.count()).toBe(1);
  });
  it('does not delete unmatched source entries shared by two different shows with the same name',async()=>{
    const db=create();await saveBundle(bundle(),db);await saveBundle({show:{...bundle().show,id:11},seasons:[],episodes:[]},db);
    await db.sources.put({id:'same-name',name:'Source',raw:'Test series',importedAt:now.toISOString(),rows:[{id:'1',title:'Test series',notes:'',state:'pending'}]});
    await deleteShow(10,db);expect((await db.sources.get('same-name'))?.rows).toHaveLength(1);expect(await db.shows.get(11)).toBeDefined();
  });
  it('resolves old retracted-episode progress before deleting and keeps other shows history',async()=>{
    const db=create();await saveBundle(bundle(),db);
    await db.progress.bulkPut([{episodeId:99,watchedAt:now.toISOString()},{episodeId:100,watchedAt:now.toISOString()}]);
    await deleteShow(10,db,async id=>id===99?10:11);
    expect(await db.progress.get(99)).toBeUndefined();expect(await db.progress.get(100)).toMatchObject({showId:11,watchedAt:now.toISOString()});
  });
  it('fails safely when old unowned progress cannot be resolved',async()=>{
    const db=create();await saveBundle(bundle(),db);await db.progress.put({episodeId:99,watchedAt:now.toISOString()});
    await expect(deleteShow(10,db,async()=>{throw new Error('offline');})).rejects.toThrow('No records were deleted');
    expect(await db.shows.count()).toBe(1);expect(await db.episodes.count()).toBe(2);expect(await db.progress.get(99)).toEqual({episodeId:99,watchedAt:now.toISOString()});
  });
});
