import { type WatchlistDB } from './db';
import { createBackup } from './backup';
import { validateBackup } from './backup-validation';
import { libraryContentKey,mergeLibraries,SyncConflict,type SharedLibrary } from './sync-merge';
const lifePrefix='syncLife:';
export const syncAckConflictKey='syncAckConflict';
const pendingUploadKey='syncPendingUpload';
export interface PendingUpload {id:string;expectedRevision:number;captured:SharedLibrary;published:SharedLibrary}
export async function readPendingUpload(database:WatchlistDB):Promise<PendingUpload|null>{
  const raw=(await database.settings.get(pendingUploadKey))?.value;
  if(raw===undefined)return null;
  try{
    if(typeof raw!=='string')throw new Error('Invalid upload intent');
    const value=JSON.parse(raw) as PendingUpload;
    if(!value||typeof value.id!=='string'||!value.id.trim()||!Number.isSafeInteger(value.expectedRevision)||value.expectedRevision<0||value.expectedRevision===Number.MAX_SAFE_INTEGER)throw new Error('Invalid upload intent');
    libraryContentKey(value.captured);libraryContentKey(value.published);return value;
  }catch{throw new SyncConflict('A pending upload could not be read. Your local copy is preserved; choose a complete library before continuing.');}
}
/** An explicit resolution may replace the exact intent it reviewed; normal tabs
 * always recover an existing intent rather than overwriting another sender.
 */
export async function acquirePendingUpload(database:WatchlistDB,intent:PendingUpload,replaceId?:string|null):Promise<PendingUpload>{
  libraryContentKey(intent.captured);libraryContentKey(intent.published);
  return database.transaction('rw',database.settings,async()=>{
    const existing=await readPendingUpload(database);
    if(existing&&existing.id!==replaceId)return existing;
    if(!existing&&typeof replaceId==='string')throw new SyncConflict('The pending upload changed while resolving this conflict. Review the library choice again.');
    await database.settings.put({key:pendingUploadKey,value:JSON.stringify(intent)});return structuredClone(intent);
  });
}
export async function clearPendingUpload(database:WatchlistDB,id:string):Promise<boolean>{
  return database.transaction('rw',database.settings,async()=>{
    if((await readPendingUpload(database))?.id!==id)return false;
    await database.settings.delete(pendingUploadKey);return true;
  });
}
export async function pausePendingUpload(database:WatchlistDB,id:string,message:string):Promise<boolean>{
  return database.transaction('rw',database.settings,async()=>{
    if((await readPendingUpload(database))?.id!==id)return false;
    await database.settings.put({key:syncAckConflictKey,value:message});return true;
  });
}
export interface LocalSyncState {current:SharedLibrary;base:SharedLibrary|null;revision:number}
export async function readLocalSync(database:WatchlistDB):Promise<LocalSyncState>{
  return database.transaction('r',[...database.tables],async()=>{
    const backup=await createBackup(database),settings=await database.settings.toArray();
    const values=new Map(settings.map(row=>[row.key,row.value]));
    const lifecycles:Record<string,string>={};
    for(const row of settings)if(row.key.startsWith(lifePrefix)&&typeof row.value==='string')lifecycles[row.key.slice(lifePrefix.length)]=row.value;
    for(const show of backup.shows)lifecycles[show.id]??='legacy-'+show.id;
    const raw=values.get('syncBase');
    return {current:{backup,epoch:String(values.get('syncEpoch')??'initial'),lifecycles},base:typeof raw==='string'?JSON.parse(raw) as SharedLibrary:null,revision:Number(values.get('syncRevision')??0)};
  });
}
export function emptyLibrary(library:SharedLibrary){return ['shows','seasons','episodes','progress','preferences','sources'].every(key=>(library.backup[key as keyof typeof library.backup] as unknown[]).length===0);}
export async function acceptSyncedState(database:WatchlistDB,expectedKey:string,next:SharedLibrary,remote:SharedLibrary,revision:number):Promise<boolean>{
  const backup=validateBackup(next.backup);
  return database.transaction('rw',[...database.tables],async()=>{
    const before=(await readLocalSync(database)).current;
    if(libraryContentKey(before)!==expectedKey)return false;
    if(libraryContentKey(before)!==libraryContentKey(next)){
      await Promise.all([database.shows.clear(),database.seasons.clear(),database.episodes.clear(),database.progress.clear(),database.preferences.clear(),database.sources.clear()]);
      await database.shows.bulkPut(backup.shows);await database.seasons.bulkPut(backup.seasons);await database.episodes.bulkPut(backup.episodes);
      await database.progress.bulkPut(backup.progress);await database.preferences.bulkPut(backup.preferences);await database.sources.bulkPut(backup.sources);
      await database.settings.where('key').startsWith(lifePrefix).delete();
      await database.settings.bulkPut(Object.entries(next.lifecycles).map(([id,value])=>({key:lifePrefix+id,value})));
      await database.settings.put({key:'syncEpoch',value:next.epoch});
      await database.settings.put({key:'catalogInitialized',value:true});
      const previousReset=(await database.settings.get('uiResetRevision'))?.value??(await database.settings.get('libraryRevision'))?.value??'';
      await database.settings.put({key:'uiResetRevision',value:before.epoch===next.epoch?previousReset:crypto.randomUUID()});
      // Invalidate UI undo and metadata requests started against an older library.
      await database.settings.put({key:'libraryRevision',value:crypto.randomUUID()});
    }
    await database.settings.put({key:'syncBase',value:JSON.stringify(remote)});
    await database.settings.put({key:'syncRevision',value:String(revision)});
    return true;
  });
}
/** A successful upload acknowledges the captured snapshot, not edits made while
 * the network request was pending. Rebase those edits under one local write lock.
 * If that cannot merge, keep the local copy and record both the acknowledged base
 * and a durable pause marker so a restart cannot publish an unreconciled copy.
 */
export async function acknowledgeSyncedState(database:WatchlistDB,captured:SharedLibrary,published:SharedLibrary,revision:number,resolveConflict=false,pendingId?:string):Promise<{applied:boolean;dirty:boolean;conflict?:string}>{
  return database.transaction('rw',[...database.tables],async()=>{
    const latest=await readLocalSync(database),pending=(await database.settings.get(syncAckConflictKey))?.value;
    if(typeof pending==='string'&&!resolveConflict)return {applied:false,dirty:true,conflict:pending};
    const upload=await readPendingUpload(database);
    if(!resolveConflict&&(upload?.id!==pendingId))return {applied:false,dirty:true};
    if(resolveConflict&&upload?.id!==pendingId)return {applied:false,dirty:true};
    // Another tab may already have acknowledged a newer cloud revision.
    if(latest.base&&latest.revision>revision)return {applied:false,dirty:true};
    const key=libraryContentKey(latest.current);
    let next=published,conflict:string|undefined;
    if(key!==libraryContentKey(captured)){
      try{next=mergeLibraries(captured,latest.current,published);}
      catch(error){if(!(error instanceof SyncConflict))throw error;next=latest.current;conflict=`Changes made during synchronization need review. ${error.message}`;}
    }
    const applied=await acceptSyncedState(database,key,next,published,revision);
    if(!applied)throw new Error('The local synchronization transaction changed unexpectedly.');
    if(conflict)await database.settings.put({key:syncAckConflictKey,value:conflict});
    else if(resolveConflict)await database.settings.delete(syncAckConflictKey);
    if(resolveConflict||upload?.id===pendingId)await database.settings.delete(pendingUploadKey);
    return {applied:true,dirty:libraryContentKey(next)!==libraryContentKey(published),...(conflict?{conflict}:{})};
  });
}
