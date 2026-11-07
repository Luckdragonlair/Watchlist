import {useEffect,useRef,useState} from 'react';
import {useLiveQuery} from 'dexie-react-hooks';
import {db} from './db';
import {episodeLabel,episodeSort,regular} from './model';
import {loadShowSetup,saveShowSetup,type SetupSnapshot} from './show-setup';

export function ShowSetup({snapshot,returnTo,busy,onDone}:{snapshot:SetupSnapshot;returnTo:string;busy:boolean;onDone:(saved:boolean)=>void}){
  const dialog=useRef<HTMLDialogElement>(null),heading=useRef<HTMLHeadingElement>(null);
  const [baseline,setBaseline]=useState(snapshot),[notes,setNotes]=useState(snapshot.notes),[current,setCurrent]=useState('');
  const [working,setWorking]=useState(false),[error,setError]=useState('');
  const episodes=useLiveQuery(()=>db.episodes.where('showId').equals(snapshot.showId).toArray(),[snapshot.showId]);
  const locked=busy||working;
  useEffect(()=>{const node=dialog.current!;node.showModal();heading.current?.focus();return()=>node.close();},[]);
  async function save(){
    if(locked)return;setWorking(true);setError('');
    try{await saveShowSetup(baseline,notes,current?Number(current):undefined);onDone(true);}
    catch(e){setError(e instanceof Error?e.message:'Setup could not be saved. Your draft is kept.');}
    finally{setWorking(false);}
  }
  async function reloadNotes(){
    if(locked)return;setWorking(true);setError('');
    try{
      const latest=await loadShowSetup(snapshot.showId);
      if(latest.life!==snapshot.life||latest.revision!==snapshot.revision)throw new Error('The library changed. Copy your draft if needed, skip this setup and reopen the show.');
      setBaseline(latest);setNotes(latest.notes);
    }catch(e){setError(e instanceof Error?e.message:'Latest notes could not be loaded.');}
    finally{setWorking(false);}
  }
  return <dialog ref={dialog} className="show-setup" aria-labelledby="show-setup-title" onCancel={event=>{event.preventDefault();if(!locked)onDone(false);}}>
    <h2 id="show-setup-title" ref={heading} tabIndex={-1}>Set up {snapshot.name}</h2>
    <p>The show is in your library. Add your place and notes now, or skip for now.</p>
    <form onSubmit={event=>{event.preventDefault();void save();}}>
      <label>Current episode (optional)<select value={current} aria-describedby="setup-progress-explanation" disabled={locked||!episodes} onChange={event=>setCurrent(event.target.value)}><option value="">I’m not sure / leave progress unchanged</option>{episodes?.filter(regular).sort(episodeSort).map(e=><option key={e.id} value={e.id}>{episodeLabel(e)}</option>)}</select></label>
      {episodes?.filter(regular).length===0&&<p>No regular episodes are listed yet. You can still save notes.</p>}
      <p id="setup-progress-explanation">Choosing an episode marks only earlier released episodes watched. The selected episode and later episodes stay unchanged.</p>
      <label>Personal notes (optional)<textarea value={notes} disabled={locked} onChange={event=>setNotes(event.target.value)}/></label>
      <p>After setup, return to {returnTo}. Skip keeps the imported show and leaves its progress and saved notes unchanged.</p>
      {error&&<div role="alert"><p>{error}</p><button type="button" disabled={locked} onClick={()=>void reloadNotes()}>Discard draft and load latest notes</button></div>}
      <div className="setup-actions"><button type="submit" disabled={locked}>{working?'Saving setup…':'Save and continue'}</button><button type="button" disabled={locked} onClick={()=>onDone(false)}>Skip for now</button></div>
    </form>
  </dialog>;
}
