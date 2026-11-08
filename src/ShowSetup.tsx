import {useEffect,useRef,useState} from 'react';
import {useLiveQuery} from 'dexie-react-hooks';
import {db} from './db';
import {displayGenres,primaryGenre,genreClass} from './genres';
import {episodeLabel,episodeSort,regular} from './model';
import {loadShowSetup,saveShowSetup,type SetupSnapshot} from './show-setup';

export function ShowSetup({snapshot,returnTo,busy,onDone}:{snapshot:SetupSnapshot;returnTo:string;busy:boolean;onDone:(saved:boolean)=>void}){
  const dialog=useRef<HTMLDialogElement>(null),heading=useRef<HTMLHeadingElement>(null);
  const [baseline,setBaseline]=useState(snapshot),[notes,setNotes]=useState(snapshot.notes),[current,setCurrent]=useState('');
  const [selectedGenre,setSelectedGenre]=useState(()=>primaryGenre(snapshot.genres??[],snapshot.primaryGenre));
  const genreChoices=displayGenres(baseline.genres??[],baseline.primaryGenre);
  const [working,setWorking]=useState(false),[error,setError]=useState('');
  const episodes=useLiveQuery(()=>db.episodes.where('showId').equals(snapshot.showId).toArray(),[snapshot.showId]);
  const locked=busy||working;
  useEffect(()=>{const node=dialog.current!;node.showModal();heading.current?.focus();return()=>node.close();},[]);
  async function save(){
    if(locked)return;setWorking(true);setError('');
    try{await saveShowSetup(baseline,notes,current==='caught-up'?'caught-up':current?Number(current):undefined,undefined,db,genreChoices.length?selectedGenre:undefined);onDone(true);}
    catch(e){setError(e instanceof Error?e.message:'Setup could not be saved. Your draft is kept.');}
    finally{setWorking(false);}
  }
  async function reloadNotes(){
    if(locked)return;setWorking(true);setError('');
    try{
      const latest=await loadShowSetup(snapshot.showId);
      if(latest.life!==snapshot.life||latest.revision!==snapshot.revision)throw new Error('The library changed. Copy your draft if needed, skip this setup and reopen the show.');
      setBaseline(latest);setNotes(latest.notes);setSelectedGenre(primaryGenre(latest.genres??[],latest.primaryGenre));
    }catch(e){setError(e instanceof Error?e.message:'Latest notes could not be loaded.');}
    finally{setWorking(false);}
  }
  return <dialog ref={dialog} className="show-setup" aria-labelledby="show-setup-title" onCancel={event=>{event.preventDefault();if(!locked)onDone(false);}}>
    <h2 id="show-setup-title" ref={heading} tabIndex={-1}>Set up {snapshot.name}</h2>
    <p>The show is in your library. Choose its primary genre, add your place and notes, or skip for now.</p>
    <form onSubmit={event=>{event.preventDefault();void save();}}>
      <fieldset className="setup-genres" disabled={locked}><legend>Primary genre</legend>{genreChoices.length?<><p>Choose the genre that sets the card color and appears first. Other genres remain available for filtering.</p><div className="setup-genre-options">{genreChoices.map(genre=><label key={genre} className={genreClass(genre)}><input type="radio" name="setup-primary-genre" value={genre} checked={selectedGenre===genre} onChange={()=>setSelectedGenre(genre)}/><span>{genre}</span>{baseline.primaryGenre===genre&&!(baseline.genres??[]).includes(genre)&&<small>Saved choice</small>}</label>)}</div></>:<p>No genres are listed yet. You can still set your place and notes.</p>}</fieldset>
      <label>Current episode (optional)<select value={current} aria-describedby="setup-progress-explanation" disabled={locked||!episodes} onChange={event=>setCurrent(event.target.value)}><option value="">I’m not sure / leave progress unchanged</option><option value="caught-up">Caught up—all aired episodes watched</option>{episodes?.filter(regular).sort(episodeSort).map(e=><option key={e.id} value={e.id}>{episodeLabel(e)}</option>)}</select></label>
      {episodes?.filter(regular).length===0&&<p>No regular episodes are listed yet. You can still save your genre and notes.</p>}
      <p id="setup-progress-explanation">{current==='caught-up'?'Marks all released regular episodes watched. Future, special and unknown-release episodes stay unchanged. The show stays tracked; new releases return to your watch queue.':'Choosing an episode marks only earlier released episodes watched. The selected episode and later episodes stay unchanged.'}</p>
      <label>Personal notes (optional)<textarea value={notes} disabled={locked} onChange={event=>setNotes(event.target.value)}/></label>
      <p>After setup, return to {returnTo}. Skip keeps the imported show and leaves its progress, saved notes and primary genre unchanged.</p>
      {error&&<div role="alert"><p>{error}</p><button type="button" disabled={locked} onClick={()=>void reloadNotes()}>Discard draft and load latest setup</button></div>}
      <div className="setup-actions"><button type="submit" disabled={locked}>{working?'Saving setup…':'Save and continue'}</button><button type="button" disabled={locked} onClick={()=>onDone(false)}>Skip for now</button></div>
    </form>
  </dialog>;
}
