import {useEffect,useRef} from 'react';

export function DeleteShowDialog({name,busy,error,onCancel,onConfirm}:{name:string;busy:boolean;error:string;onCancel:()=>void;onConfirm:()=>void}) {
  const dialog=useRef<HTMLDialogElement>(null),cancel=useRef<HTMLButtonElement>(null);
  useEffect(()=>{const node=dialog.current!;node.showModal();cancel.current?.focus();return()=>{if(node.open)node.close();};},[]);
  return <dialog ref={dialog} className="show-setup delete-dialog" aria-labelledby="delete-show-title" onCancel={event=>{event.preventDefault();if(!busy)onCancel();}}>
    <h2 id="delete-show-title">Delete {name}?</h2>
    <p>This removes the show, its seasons, episodes, watched history, notes, order and matching import entries from your library. Other shows, original files and existing backups stay unchanged.</p>
    <p>Undo is available on this page until you reload or delete another show. Changes on another device or tab may prevent undo.</p>
    {error&&<p role="alert">{error}</p>}
    <div className="setup-actions"><button ref={cancel} disabled={busy} onClick={onCancel}>Cancel</button><button className="delete-confirm" disabled={busy} onClick={onConfirm}>Delete {name}</button></div>
  </dialog>;
}
