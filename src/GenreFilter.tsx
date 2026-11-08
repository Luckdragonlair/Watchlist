import {useEffect,useRef} from 'react';
import {genreClass} from './genres';
export function GenreFilter({choices,selected,onChange}:{choices:string[];selected:string[];onChange:(value:string[])=>void}){
 const panel=useRef<HTMLDetailsElement>(null);
 useEffect(()=>{const close=(event:PointerEvent)=>{if(panel.current&&!panel.current.contains(event.target as Node))panel.current.open=false;};document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close);},[]);
 return <details className="genre-filter" ref={panel} onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();event.currentTarget.open=false;event.currentTarget.querySelector('summary')?.focus();}}}>
  <summary>Genres{selected.length?' ('+selected.length+')':''}</summary><div className="genre-panel"><fieldset><legend>Show genres</legend><p>Choose any combination. No checks shows all genres.</p>{choices.map(name=><label key={name} className={genreClass(name)}><input type="checkbox" checked={selected.includes(name)} onChange={event=>onChange(event.target.checked?[...selected,name]:selected.filter(value=>value!==name))}/><span>{name}</span></label>)}</fieldset><button disabled={!selected.length} onClick={()=>onChange([])}>Show all genres</button></div>
 </details>;
}
