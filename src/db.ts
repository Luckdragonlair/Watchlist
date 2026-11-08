import {filedTitle} from './titles';
import Dexie, { type Table } from 'dexie';
import type { Show, Season, Episode, Progress, Preference, Source, Bundle } from './model';
import { regular, released, episodeSort } from './model';
import { libraryDatabaseName } from './library-scope';
export class WatchlistDB extends Dexie {
  shows!: Table<Show, number>; seasons!: Table<Season, number>; episodes!: Table<Episode, number>;
  progress!: Table<Progress, number>; preferences!: Table<Preference, number>; sources!: Table<Source, string>;
  settings!: Table<{key:string;value:string|boolean},string>;
  constructor(name = libraryDatabaseName()) {
    super(name);
    this.version(1).stores({ shows: 'id, name', seasons: 'id, showId', episodes: 'id, showId, [showId+season]', progress: 'episodeId', preferences: 'showId, order', sources: 'id' });
    this.version(2).stores({progress:'episodeId, showId'}).upgrade(async transaction=>{
      const owners=new Map((await transaction.table<Episode>('episodes').toArray()).map(e=>[e.id,e.showId]));
      await transaction.table<Progress>('progress').toCollection().modify(p=>{p.showId ??= owners.get(p.episodeId);});
    });
    this.version(3).stores({settings:'key'}).upgrade(async transaction=>{
      if (await transaction.table('sources').count() || await transaction.table('shows').count()) await transaction.table('settings').put({key:'catalogInitialized',value:true});
    });
  }
}
export const db = new WatchlistDB();
export async function libraryRevision(database=db):Promise<string> {return String((await database.settings.get('libraryRevision'))?.value??'');}
export async function assertLibraryRevision(expected:string,database=db) {
  if(await libraryRevision(database)!==expected) throw new Error('The library was restored or synchronized while this request was running. Please try again.');
}
export async function initializeCatalog(source:Source,database=db) {
  await database.transaction('rw',database.sources,database.settings,async()=>{
    if((await database.settings.get('catalogInitialized'))?.value===true) return;
    if(!await database.sources.get(source.id)) await database.sources.add(source);
    await database.settings.put({key:'catalogInitialized',value:true});
  });
}
export async function addImportSource(source:Source,expectedRevision:string,database=db) {
  await database.transaction('rw',database.sources,database.settings,async()=>{
    await assertLibraryRevision(expectedRevision,database);
    await database.sources.add(source);
  });
}
export async function saveBundle(bundle: Bundle, database = db, requireExisting = false, expectedRevision?:string) {
  await database.transaction('rw', [database.shows, database.seasons, database.episodes, database.preferences, database.progress, database.settings], async () => {
    if(expectedRevision!==undefined) await assertLibraryRevision(expectedRevision,database);
    if (requireExisting && !await database.shows.get(bundle.show.id)) throw new Error('This show was deleted. Refresh cannot add it back.');
    // Retain ownership even if the provider retracts an episode during this refresh.
    for (const episode of await database.episodes.where('showId').equals(bundle.show.id).toArray()) await database.progress.update(episode.id,{showId:bundle.show.id});
    if(!await database.shows.get(bundle.show.id))await database.settings.put({key:'syncLife:'+bundle.show.id,value:crypto.randomUUID()});
    await database.shows.put({...bundle.show,name:filedTitle(bundle.show.name)});
    await database.seasons.where('showId').equals(bundle.show.id).delete();
    await database.episodes.where('showId').equals(bundle.show.id).delete();
    await database.seasons.bulkPut(bundle.seasons);
    await database.episodes.bulkPut(bundle.episodes);
    if (!await database.preferences.get(bundle.show.id)) await database.preferences.put({ showId: bundle.show.id, order: await database.preferences.count(), notes: '' });
  });
}
export async function setWatched(episodeId: number, watched: boolean, database = db) {
  await database.transaction('rw',database.episodes,database.progress,async()=>{
    if (watched) {
      const episode=await database.episodes.get(episodeId);
      if (!episode) throw new Error('This episode no longer exists in your library.');
      await database.progress.put({episodeId,showId:episode.showId,watchedAt:new Date().toISOString()});
    } else await database.progress.delete(episodeId);
  });
}
export async function onboard(showId: number, currentId: number, now = new Date(), database = db) {
  await database.transaction('rw',database.episodes,database.progress,async()=>{
  const episodes = (await database.episodes.where('showId').equals(showId).toArray()).filter(regular).sort(episodeSort);
  const current = episodes.find(e => e.id === currentId);
  if (!current) throw new Error('Choose a current episode first.');
  const earlier = episodes.filter(e => episodeSort(e, current) < 0 && released(e, now));
  // Only backfill explicit earlier releases. Leave current and future episodes untouched.
    for (const e of earlier) if (!await database.progress.get(e.id)) await database.progress.put({ episodeId: e.id, showId, watchedAt: now.toISOString() });
  });
}

export async function markCaughtUp(showId:number, now=new Date(), database=db) {
  await database.transaction('rw',database.shows,database.episodes,database.progress,async()=>{
    if(!await database.shows.get(showId))throw new Error('This show is no longer in your library.');
    const episodes=await database.episodes.where('showId').equals(showId).toArray();
    for(const episode of episodes.filter(e=>regular(e)&&released(e,now))) {
      if(!await database.progress.get(episode.id))await database.progress.put({episodeId:episode.id,showId,watchedAt:now.toISOString()});
    }
  });
}

export async function deleteShow(showId: number, database = db, resolveLegacyOwner?: (episodeId:number)=>Promise<number>) {
  const expectedRevision=await libraryRevision(database);
  // Version 1 could retain history after its episode metadata disappeared. Resolve
  // those IDs before deletion; never guess ownership or purge another show's history.
  const legacyOwners=new Map<number,number>();
  for (const progress of await database.progress.filter(p=>p.showId===undefined).toArray()) {
    const episode=await database.episodes.get(progress.episodeId);
    if (episode) legacyOwners.set(progress.episodeId,episode.showId);
    else {
      if (!resolveLegacyOwner) throw new Error('Older viewing history needs its episode metadata linked before deletion. No records were deleted.');
      try {
        const owner=await resolveLegacyOwner(progress.episodeId);
        if (!Number.isSafeInteger(owner)||owner<=0) throw new Error('Invalid show ID');
        legacyOwners.set(progress.episodeId,owner);
      } catch { throw new Error('Older viewing history could not be linked to its show. Please reconnect and retry deletion. No records were deleted.'); }
    }
  }
  await database.transaction('rw',[database.shows,database.seasons,database.episodes,database.progress,database.preferences,database.sources,database.settings],async()=>{
    await assertLibraryRevision(expectedRevision,database);
    const show=await database.shows.get(showId);
    if (!show) return;
    const sources=await database.sources.toArray();
    const normalize=(name:string)=>name.normalize('NFKC').trim().toLocaleLowerCase();
    const names=new Set([normalize(show.name),...sources.flatMap(s=>s.rows.filter(r=>r.showId===showId).map(r=>normalize(r.title)))]);
    const otherNames=new Set([...(await database.shows.filter(s=>s.id!==showId).toArray()).map(s=>normalize(s.name)),...sources.flatMap(s=>s.rows.filter(r=>r.showId!==undefined&&r.showId!==showId).map(r=>normalize(r.title)))]);
    for (const [episodeId,owner] of legacyOwners) await database.progress.update(episodeId,{showId:owner});
    const episodeIds=await database.episodes.where('showId').equals(showId).primaryKeys();
    await database.progress.where('showId').equals(showId).delete();
    await database.progress.bulkDelete(episodeIds);
    await database.episodes.where('showId').equals(showId).delete();
    await database.seasons.where('showId').equals(showId).delete();
    await database.preferences.delete(showId);
    await database.shows.delete(showId);
    await database.settings.put({key:'syncLife:'+showId,value:crypto.randomUUID()});
    for (const source of sources) {
      const rows=source.rows.filter(r=>r.showId!==showId && !(r.showId===undefined && names.has(normalize(r.title)) && !otherNames.has(normalize(r.title))));
      // Keep the source ID even when empty so startup does not reload its original seed.
      if (rows.length!==source.rows.length) await database.sources.put({...source,rows,raw:JSON.stringify(rows,null,2)});
    }
  });
}
