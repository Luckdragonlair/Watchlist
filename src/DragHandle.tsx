import {useEffect,useLayoutEffect,useId,useRef,useState,type KeyboardEvent,type PointerEvent} from 'react';
import {moveInOrder,type OrderSnapshot} from './binge-order';
type Props={id:number;name:string;sectionName:string;generation:string;visibleIds:number[];disabled:boolean;capture:()=>OrderSnapshot;commit:(snapshot:OrderSnapshot,ids:number[])=>Promise<boolean>};
type Move={snapshot:OrderSnapshot;visible:number[];target:number;pointer:number|null;startY:number;y:number;startScroll:number;grabOffset:number;active:boolean;element:HTMLButtonElement};
export function DragHandle({id,name,sectionName,generation,visibleIds,disabled,capture,commit}:Props){
 const button=useRef<HTMLButtonElement>(null),pendingFocus=useRef<{ids:number[]|null}|null>(null);
 const hint=useId(),move=useRef<Move|null>(null),frame=useRef(0),[active,setActive]=useState(false),[message,setMessage]=useState('');
 useLayoutEffect(()=>{const pending=pendingFocus.current;if(!disabled&&pending&&(pending.ids===null||JSON.stringify(capture().members.map(m=>m.id))===JSON.stringify(pending.ids))){pendingFocus.current=null;button.current?.focus({preventScroll:true});}},[generation,disabled,message]);
 const cards=()=>Array.from(document.querySelectorAll<HTMLElement>('article[data-sort-id]')).filter(e=>e.dataset.sortSection===move.current?.snapshot.section&&e.dataset.sortStarted===String(!!move.current?.snapshot.started));
 function clear(){
  const current=move.current;move.current=null;cancelAnimationFrame(frame.current);frame.current=0;
  for(const card of document.querySelectorAll<HTMLElement>('.drag-source,.drop-before,.drop-after')){card.classList.remove('drag-source','drop-before','drop-after');card.style.transform='';}
  if(current?.pointer!==null&&current?.element.hasPointerCapture(current!.pointer!))current.element.releasePointerCapture(current.pointer!);
  setActive(false);return current;
 }
 function cancel(){if(move.current){clear();setMessage('Move cancelled. Order unchanged.');}}
 useEffect(()=>{cancel();},[generation,disabled]);
 useEffect(()=>{window.addEventListener('blur',cancel);window.addEventListener('resize',cancel);document.addEventListener('visibilitychange',cancel);return()=>{window.removeEventListener('blur',cancel);window.removeEventListener('resize',cancel);document.removeEventListener('visibilitychange',cancel);clear();};},[]);
 function indicate(target:number){
  const current=move.current;if(!current)return;
  for(const card of cards()){card.classList.remove('drop-before','drop-after');if(Number(card.dataset.sortId)===target&&target!==id)card.classList.add(current.visible.indexOf(target)<current.visible.indexOf(id)?'drop-before':'drop-after');}
  if(current.target!==target){current.target=target;const order=moveInOrder(current.snapshot.members.map(m=>m.id),id,target);setMessage(name+', position '+(order.indexOf(id)+1)+' of '+order.length+' in '+sectionName+'.');}
 }
 function animate(){
  const current=move.current;if(!current||!current.active||current.pointer===null)return;
  const nav=document.querySelector<HTMLElement>('nav[aria-label="Views"]'),navTop=nav?.getBoundingClientRect().top??innerHeight;
  const bottom=navTop>innerHeight/2?navTop:innerHeight;
  if(current.y<90)window.scrollBy(0,-Math.ceil((90-current.y)/5));else if(current.y>bottom-65)window.scrollBy(0,Math.ceil((current.y-bottom+65)/5));
  let target=id,distance=Infinity;
  for(const card of cards()){
   if(Number(card.dataset.sortId)===id)card.style.transform='';
   const rect=card.getBoundingClientRect(),offset=0;
   const delta=Math.abs(current.y-current.grabOffset-(rect.top-offset+rect.height/2));if(delta<distance){distance=delta;target=Number(card.dataset.sortId);}
   if(Number(card.dataset.sortId)===id){card.classList.add('drag-source');card.style.transform='translateY('+(current.y-current.startY+scrollY-current.startScroll)+'px)';}
  }
  indicate(target);frame.current=requestAnimationFrame(animate);
 }
 function begin(element:HTMLButtonElement,pointer:number|null,y=0){
  const snapshot=capture();move.current={snapshot,visible:[...visibleIds],target:id,pointer,startY:y,y,startScroll:scrollY,grabOffset:pointer===null?0:y-(()=>{const rect=element.closest('article')!.getBoundingClientRect();return rect.top+rect.height/2;})(),active:pointer===null,element};
  if(pointer===null){setActive(true);setMessage('Picked up '+name+'. Use Up or Down, Home or End; Space or Enter drops, Escape cancels.');}
 }
 async function drop(){
  const current=clear();if(!current?.active)return;
  if(current.target===id){setMessage('Order unchanged.');return;}
  setMessage('Saving position.');const ids=moveInOrder(current.snapshot.members.map(m=>m.id),id,current.target);
  pendingFocus.current={ids};const saved=await commit(current.snapshot,ids);if(!saved)pendingFocus.current={ids:null};setMessage(saved?name+' moved to position '+(ids.indexOf(id)+1)+' of '+ids.length+' in '+sectionName+'. Saved.':'Move not saved. Review the message above and try again.');
 }
 function down(event:PointerEvent<HTMLButtonElement>){if(disabled||!event.isPrimary||event.button!==0)return;event.preventDefault();event.currentTarget.focus({preventScroll:true});begin(event.currentTarget,event.pointerId,event.clientY);event.currentTarget.setPointerCapture(event.pointerId);}
 function motion(event:PointerEvent<HTMLButtonElement>){const current=move.current;if(!current||current.pointer!==event.pointerId)return;current.y=event.clientY;if(!current.active&&Math.abs(current.y-current.startY)>6){current.active=true;setActive(true);setMessage('Picked up '+name+'. Drag within '+sectionName+' and release to save.');frame.current=requestAnimationFrame(animate);}}
 function key(event:KeyboardEvent<HTMLButtonElement>){
  if(event.key==='Tab'&&move.current)cancel();
  if(event.key==='Escape'&&move.current){event.preventDefault();cancel();return;}
  if(event.repeat&&[' ','Enter'].includes(event.key))return;
  if([' ','Enter'].includes(event.key)){event.preventDefault();if(move.current)void drop();else if(!disabled)begin(event.currentTarget,null);return;}
  const current=move.current;if(!current||current.pointer!==null||!['ArrowUp','ArrowDown','Home','End'].includes(event.key))return;
  event.preventDefault();const index=current.visible.indexOf(current.target),next=event.key==='Home'?0:event.key==='End'?current.visible.length-1:Math.max(0,Math.min(current.visible.length-1,index+(event.key==='ArrowUp'?-1:1)));
  indicate(current.visible[next]);cards().find(c=>Number(c.dataset.sortId)===current.visible[next])?.scrollIntoView({block:'nearest',behavior:'instant'});
 }
 return <><button ref={button} className="drag-handle" type="button" aria-label={'Drag '+name} aria-describedby={hint} aria-pressed={active} disabled={disabled} onPointerDown={down} onPointerMove={motion} onPointerUp={e=>{if(move.current?.pointer===e.pointerId){move.current.y=e.clientY;if(move.current.active){cancelAnimationFrame(frame.current);animate();}void drop();}}} onPointerCancel={cancel} onLostPointerCapture={cancel} onKeyDown={key} onClick={e=>{if(e.detail===0&&!disabled){if(move.current?.pointer===null)void drop();else if(!move.current)begin(e.currentTarget,null);}}}><span aria-hidden="true">⠿</span> Drag</button><span id={hint} className="sr-only">Reorder within {sectionName}. Drag the handle, or press Space, use arrow keys, then Space to save. Escape cancels. Up/down buttons are also available.</span><span className="sr-only" role="status" aria-live="polite" aria-atomic="true">{message}</span></>;
}
