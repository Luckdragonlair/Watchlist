import { db, type WatchlistDB } from './db';
import type { Backup } from './model';
import { validateBackup } from './backup-validation';

export async function createBackup(database:WatchlistDB=db):Promise<Backup> {
  return database.transaction('r',[database.shows,database.seasons,database.episodes,database.progress,database.preferences,database.sources],async()=>{
    const [shows,seasons,episodes,progress,preferences,sources]=await Promise.all([
      database.shows.toArray(),database.seasons.toArray(),database.episodes.toArray(),
      database.progress.toArray(),database.preferences.toArray(),database.sources.toArray(),
    ]);
    return {version:1 as const,exportedAt:new Date().toISOString(),shows,seasons,episodes,progress,preferences,sources};
  });
}

export async function restoreBackup(value:unknown,database:WatchlistDB=db):Promise<Backup> {
  const backup=validateBackup(value);
  await database.transaction('rw',[database.shows,database.seasons,database.episodes,database.progress,database.preferences,database.sources,database.settings],async()=>{
    await Promise.all([database.shows.clear(),database.seasons.clear(),database.episodes.clear(),database.progress.clear(),database.preferences.clear(),database.sources.clear()]);
    await database.shows.bulkPut(backup.shows);await database.seasons.bulkPut(backup.seasons);await database.episodes.bulkPut(backup.episodes);
    await database.progress.bulkPut(backup.progress);await database.preferences.bulkPut(backup.preferences);await database.sources.bulkPut(backup.sources);
    await database.settings.put({key:'catalogInitialized',value:true});
    const revision=crypto.randomUUID();
    await database.settings.put({key:'libraryRevision',value:revision});
    await database.settings.put({key:'uiResetRevision',value:revision});
    await database.settings.put({key:'syncEpoch',value:crypto.randomUUID()});
    await database.settings.where('key').startsWith('syncLife:').delete();
    await database.settings.bulkPut(backup.shows.map(show=>({key:'syncLife:'+show.id,value:crypto.randomUUID()})));
  });
  return backup;
}
