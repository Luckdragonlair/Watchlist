import {useEffect,useRef,useState} from 'react';
import {getFirestore} from 'firebase/firestore';
import {db} from './db';
import {LibrarySync,type SyncStatus} from './sync-engine';
import {readRemote,writeRemote,watchRemote,validateCloudUpload} from './cloud-transport';
import {BackupExport} from './BackupExport';
export function CloudSyncStatus({uid,onMetadataPause}:{uid:string;onMetadataPause?:(paused:boolean)=>void}){
  const [status,setStatus]=useState<SyncStatus>({phase:'checking',message:'Checking the shared library…'});
  const [choice,setChoice]=useState<'device'|'cloud'|null>(null),[confirmed,setConfirmed]=useState(false),[working,setWorking]=useState(false);
  const engine=useRef<LibrarySync|null>(null);
  useEffect(()=>{
    if(db.name!==`watchlist-cloud-v01-${uid}`){setStatus({phase:'error',message:'The library account does not match. Please sign out and sign in again.'});return;}
    const firestore=getFirestore();
    const sync=new LibrarySync(db,{read:()=>readRemote(firestore,uid),write:(revision,library)=>writeRemote(firestore,uid,revision,library),validate:validateCloudUpload,watch:(changed,error)=>watchRemote(firestore,uid,changed,error)},next=>{setStatus(next);onMetadataPause?.(['checking','conflict','invalid'].includes(next.phase));});
    engine.current=sync;sync.start();return()=>{sync.stop();engine.current=null;};
  },[uid,onMetadataPause]);
  async function resolve(){if(!choice||!confirmed)return;setWorking(true);await engine.current?.resolve(choice);setWorking(false);setChoice(null);setConfirmed(false);}
  return <section className="cloud-sync" data-phase={status.phase} aria-label="Library synchronization"><p role="status"><span className={status.phase==='saved'?'sync-full':undefined}>{status.message}</span>{status.phase==='saved'&&<span className="sync-short">Up to date</span>}</p>
    {status.phase==='error'&&<button onClick={()=>void engine.current?.sync()}>Retry sync</button>}
    {status.phase==='invalid'&&<><p>Sync is paused because some saved data could not be read. Your local copy is preserved. Export a backup before making changes.</p><BackupExport disabled={working}/><button disabled={working} onClick={()=>void engine.current?.sync()}>Retry sync</button></>}
    {status.phase==='conflict'&&<><p>Sync is paused. Export this device’s library before choosing a complete copy. Different edits have not been discarded.</p><BackupExport disabled={working}/>
      <button disabled={working} onClick={()=>{setChoice('device');setConfirmed(false);}}>Use this device’s library everywhere</button>
      <button disabled={working} onClick={()=>{setChoice('cloud');setConfirmed(false);}}>Use the shared library on this device</button>
      {choice&&<div role="group" aria-label="Confirm sync conflict choice"><p>{choice==='device'?'This replaces the shared library with this device’s complete copy. Other devices receive it.':'This replaces this device’s complete library with the shared copy. Local conflicting edits will be removed.'}</p>
      <label><input type="checkbox" checked={confirmed} onChange={event=>setConfirmed(event.target.checked)}/>I have kept any backup I need and want to replace this library.</label>
      <button disabled={!confirmed||working} onClick={resolve}>{working?'Applying choice…':'Confirm library choice'}</button><button disabled={working} onClick={()=>setChoice(null)}>Cancel choice</button></div>}
    </>}
  </section>;
}
