import {libraryRevision,saveBundle,type WatchlistDB} from './db';
import type {Bundle,Show} from './model';
import {validateBackup} from './backup-validation';

export const metadataInterval=24*60*60*1000;
const leaseKey='metadataRefreshLease',backoffKey='metadataRefreshBackoff';
const retryKey=(id:number)=>`metadataRefreshRetry:${id}`;
export function metadataDue(show:Show,now:Date){
  const checked=Date.parse(show.syncedAt);
  return !Number.isFinite(checked)||checked>now.getTime()||now.getTime()-checked>=metadataInterval;
}
interface Options {
  now:()=>Date;active:()=>boolean;fetch:(id:number)=>Promise<Bundle>;
  pause:(ms:number)=>Promise<void>;message?:(message:string)=>void;
}
// Lease/retry settings are device-local housekeeping, never personal library data.
// Each fetch captures identity and revision before networking, then checks both
// inside the same transaction that replaces the provider snapshot.
export async function refreshDueMetadata(database:WatchlistDB,options:Options){
  const {now,active,message}=options,owner=crypto.randomUUID();
  const acquire=()=>database.transaction('rw',database.settings,async()=>{
    if(Number((await database.settings.get(backoffKey))?.value)>now().getTime())return false;
    const raw=(await database.settings.get(leaseKey))?.value;
    if(typeof raw==='string'){
      try{const lease=JSON.parse(raw);if(lease.owner!==owner&&lease.until>now().getTime())return false;}catch{/* Expired/unreadable housekeeping may be replaced. */}
    }
    await database.settings.put({key:leaseKey,value:JSON.stringify({owner,until:now().getTime()+90000})});return true;
  });
  if(!active()||!await acquire())return;
  try{
    const shows=(await database.shows.toArray()).filter(show=>metadataDue(show,now())).sort((a,b)=>(Date.parse(a.syncedAt)||0)-(Date.parse(b.syncedAt)||0));
    for(const candidate of shows){
      if(!active()||!await acquire())break;
      const snapshot=await database.transaction('r',database.shows,database.settings,async()=>{
        const show=await database.shows.get(candidate.id);
        if(!show||!metadataDue(show,now())||Number((await database.settings.get(retryKey(show.id)))?.value)>now().getTime()||(await database.settings.get('syncAckConflict'))?.value)return null;
        return {show,revision:await libraryRevision(database),life:(await database.settings.get('syncLife:'+show.id))?.value};
      });
      if(!snapshot)continue;
      message?.('Checking TVmaze for new seasons and episodes…');
      try{
        const bundle=await options.fetch(snapshot.show.id);
        validateBackup({version:1,exportedAt:now().toISOString(),shows:[bundle.show],seasons:bundle.seasons,episodes:bundle.episodes,progress:[],preferences:[{showId:snapshot.show.id,order:0,notes:''}],sources:[]});
        if(bundle.show.id!==snapshot.show.id||bundle.seasons.some(s=>s.showId!==snapshot.show.id)||bundle.episodes.some(e=>e.showId!==snapshot.show.id))throw new Error('Provider identity changed.');
        if(!active())break;
        const applied=await database.transaction('rw',[database.shows,database.seasons,database.episodes,database.preferences,database.progress,database.settings],async()=>{
          if(!active()||(await database.settings.get('syncAckConflict'))?.value||await libraryRevision(database)!==snapshot.revision)return false;
          const lease=await database.settings.get(leaseKey);
          if(typeof lease?.value!=='string'||JSON.parse(lease.value).owner!==owner)return false;
          if((await database.settings.get('syncLife:'+snapshot.show.id))?.value!==snapshot.life||JSON.stringify(await database.shows.get(snapshot.show.id))!==JSON.stringify(snapshot.show))return false;
          const existingSeasons=await database.seasons.bulkGet(bundle.seasons.map(s=>s.id)),existingEpisodes=await database.episodes.bulkGet(bundle.episodes.map(e=>e.id));
          if([...existingSeasons,...existingEpisodes].some(row=>row&&row.showId!==snapshot.show.id))throw new Error('Provider identifiers belong to another saved show.');
          await saveBundle({...bundle,show:{...bundle.show,syncedAt:now().toISOString()}},database,true,snapshot.revision);
          await database.settings.delete(retryKey(snapshot.show.id));return true;
        });
        if(!applied)break;
      }catch{
        if(active()){
          await database.settings.bulkPut([{key:retryKey(snapshot.show.id),value:String(now().getTime()+60*60*1000)},{key:backoffKey,value:String(now().getTime()+15*60*1000)}]);
          message?.('Automatic episode checks could not finish. Your saved library is kept; checks will retry automatically.');
        }
        return;
      }
      // Three requests per bundle; keep comfortably below TVmaze's IP limit.
      await options.pause(2000);
    }
    message?.('Episode information is checked daily while Watchlist is open and online.');
  }finally{
    await database.transaction('rw',database.settings,async()=>{
      const raw=(await database.settings.get(leaseKey))?.value;
      if(typeof raw==='string'&&JSON.parse(raw).owner===owner)await database.settings.delete(leaseKey);
    });
  }
}
