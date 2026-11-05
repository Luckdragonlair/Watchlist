import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { parseBackup } from './backup-validation';
import { restoreBackup } from './backup';
import type { Backup } from './model';
import { BackupExport } from './BackupExport';

export function BackupRestore({disabled,onRestored,onBusyChange}:{disabled:boolean;onRestored:()=>void;onBusyChange:(busy:boolean)=>void}) {
  const input=useRef<HTMLInputElement>(null),dialog=useRef<HTMLDialogElement>(null);
  const [preview,setPreview]=useState<Backup|null>(null),[filename,setFilename]=useState('');
  const [working,setWorking]=useState(false),[confirmed,setConfirmed]=useState(false);
  const [error,setError]=useState(''),[message,setMessage]=useState('');
  const current=useLiveQuery(async()=>({shows:await db.shows.count(),progress:await db.progress.count()}));
  useEffect(()=>{
    if(preview&&!dialog.current?.open) dialog.current?.showModal();
    else if(!preview&&dialog.current?.open) dialog.current.close();
  },[preview]);
  function cancel(){if(!working){setPreview(null);setConfirmed(false);setError('');setMessage('Restore cancelled. Your library is unchanged.');}}
  async function readFile(file:File){
    setWorking(true);onBusyChange(true);setError('');setMessage('Checking backup…');setPreview(null);setConfirmed(false);
    try {
      if(file.size>50_000_000) throw new Error('Choose a backup smaller than 50 MB.');
      setPreview(parseBackup(await file.text()));setFilename(file.name);setMessage('');
    }catch(e){setMessage('');setError(e instanceof Error?e.message:'Could not read this backup. Your library is unchanged.');}
    finally{setWorking(false);onBusyChange(false);}
  }
  async function restore(){
    if(!preview||!confirmed||working) return;
    setWorking(true);onBusyChange(true);setError('');
    try{await restoreBackup(preview);setPreview(null);setConfirmed(false);setMessage('Backup restored. Your library and viewing progress are ready.');onRestored();}
    catch(e){setError(`Restore failed. Your existing library is unchanged. ${e instanceof Error?e.message:''}`);}
    finally{setWorking(false);onBusyChange(false);}
  }
  return <section className="backup-restore" aria-label="Backup restore">
    <button disabled={disabled||working} onClick={()=>input.current?.click()}>Restore backup</button>
    <input ref={input} type="file" hidden accept=".json,application/json" aria-label="Backup file" onChange={event=>{const file=event.target.files?.[0];event.target.value='';if(file) void readFile(file);}}/>
    <p role="status">{message}</p>{error&&!preview&&<p role="alert">{error}</p>}
    <dialog ref={dialog} aria-labelledby="restore-heading" onCancel={event=>{event.preventDefault();cancel();}}>
      <h2 id="restore-heading">Restore this backup?</h2>
      {preview&&<><p>{filename}</p><p>Saved {new Date(preview.exportedAt).toLocaleString('en-US',{timeZone:'America/Chicago',timeZoneName:'short'})}</p>
      <p>{preview.shows.length} shows · {preview.episodes.length} episodes · {preview.progress.length} watched-episode records · {preview.sources.reduce((sum,s)=>sum+s.rows.length,0)} source entries</p>
      <p>Your current library has {current?.shows??'…'} shows and {current?.progress??'…'} watched-episode records. Restoring replaces the whole library, including its notes and ordering.</p>
      <p>To keep your current changes, export a backup before replacing them.</p><BackupExport disabled={working}/>
      <label><input type="checkbox" checked={confirmed} disabled={working} onChange={e=>setConfirmed(e.target.checked)}/>Replace my current library with this backup.</label>
      {error&&<p role="alert">{error}</p>}
      <div><button disabled={working} onClick={cancel}>Cancel restore</button><button className="danger" disabled={!confirmed||working} onClick={restore}>{working?'Restoring…':'Replace library and restore'}</button></div></>}
    </dialog>
  </section>;
}
