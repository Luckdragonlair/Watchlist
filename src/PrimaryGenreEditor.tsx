import {useEffect,useRef,useState} from 'react';
import {db} from './db';
import {displayGenres,genreClass,primaryGenre} from './genres';
import {loadShowSetup,saveShowSetup,type SetupSnapshot} from './show-setup';
export function PrimaryGenreEditor({showId,name,disabled}:{showId:number;name:string;disabled:boolean}){
 const [snapshot,setSnapshot]=useState<SetupSnapshot|null>(null),[selected,setSelected]=useState(''),[working,setWorking]=useState(false),[error,setError]=useState('');
 const dialog=useRef<HTMLDialogElement>(null),opener=useRef<HTMLButtonElement>(null),heading=useRef<HTMLHeadingElement>(null);
 const locked=disabled||working,options=snapshot?displayGenres(snapshot.genres??[],snapshot.primaryGenre):[];
 useEffect(()=>{if(!snapshot)return;const node=dialog.current!;node.showModal();heading.current?.focus();return()=>{node.close();opener.current?.focus();};},[snapshot!==null]);
 async function open(){if(locked)return;setWorking(true);setError('');try{const current=await loadShowSetup(showId);setSelected(primaryGenre(current.genres??[],current.primaryGenre));setSnapshot(current);}catch(e){setError(e instanceof Error?e.message:'Could not load the genre choices.');}finally{setWorking(false);}}
 async function save(){if(locked||!snapshot||!options.length)return;setWorking(true);setError('');try{await saveShowSetup(snapshot,snapshot.notes,undefined,undefined,db,selected);setSnapshot(null);}catch(e){setError(e instanceof Error?e.message:'Could not save. Your choice is kept.');}finally{setWorking(false);}}
 async function reload(){if(locked||!snapshot)return;setWorking(true);setError('');try{const current=await loadShowSetup(showId);if(current.life!==snapshot.life||current.revision!==snapshot.revision)throw new Error('The show or library was replaced. Cancel and reopen Manage.');setSnapshot(current);setSelected(primaryGenre(current.genres??[],current.primaryGenre));}catch(e){setError(e instanceof Error?e.message:'Could not load the latest choice.');}finally{setWorking(false);}}
 return <><button ref={opener} type="button" disabled={locked} onClick={()=>void open()}>Change primary genre</button>{!snapshot&&error&&<p role="alert">{error}</p>}{snapshot&&<dialog ref={dialog} className="show-setup primary-genre-editor" aria-labelledby={'genre-editor-title-'+showId} onCancel={event=>{event.preventDefault();if(!locked)setSnapshot(null);}}>
 <h2 ref={heading} tabIndex={-1} id={'genre-editor-title-'+showId}>Primary genre for {name}</h2><p>Sets the card color and first tag. Other genres, notes and watched history stay unchanged.</p>
 <fieldset className="setup-genres" disabled={locked}><legend>Primary genre</legend><div className="setup-genre-options">{options.map(genre=><label key={genre} className={genreClass(genre)}><input type="radio" name={'manage-primary-'+showId} value={genre} checked={selected===genre} onChange={()=>setSelected(genre)}/><span>{genre}</span></label>)}</div>{!options.length&&<p>No genres are listed yet.</p>}</fieldset>
 {error&&<div role="alert"><p>{error}</p><button type="button" disabled={locked} onClick={()=>void reload()}>Discard choice and load latest</button></div>}
 <div className="setup-actions"><button type="button" disabled={locked||!options.length} onClick={()=>void save()}>{working?'Saving…':'Save primary genre'}</button><button type="button" disabled={locked} onClick={()=>setSnapshot(null)}>Cancel</button></div></dialog>}</>;
}
