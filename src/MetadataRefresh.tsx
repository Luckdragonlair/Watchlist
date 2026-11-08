import {useEffect,useRef,useState} from 'react';
import {db} from './db';
import {fetchBundle} from './tvmaze';
import {refreshDueMetadata} from './metadata-refresh';

export function MetadataRefresh({paused}:{paused:boolean}){
  const pause=useRef(paused);pause.current=paused;
  const wake=useRef<()=>void>(()=>{});
  const [message,setMessage]=useState('Episode information is checked daily while Watchlist is open and online.');
  useEffect(()=>{
    let stopped=false,running=false;
    const active=()=>!stopped&&!pause.current&&navigator.onLine&&document.visibilityState==='visible';
    async function tick(){
      if(running||!active())return;running=true;
      try{await refreshDueMetadata(db,{now:()=>new Date(),active,fetch:fetchBundle,pause:ms=>new Promise(resolve=>setTimeout(resolve,ms)),message:value=>{if(!stopped)setMessage(value);}});}
      catch{if(!stopped)setMessage('Automatic episode checks will retry. Your saved library is kept.');}
      finally{running=false;}
    }
    const trigger=()=>void tick(),timer=setInterval(trigger,60000),initial=setTimeout(trigger,0);
    wake.current=trigger;
    window.addEventListener('online',trigger);window.addEventListener('focus',trigger);document.addEventListener('visibilitychange',trigger);
    return()=>{stopped=true;wake.current=()=>{};clearTimeout(initial);clearInterval(timer);window.removeEventListener('online',trigger);window.removeEventListener('focus',trigger);document.removeEventListener('visibilitychange',trigger);};
  },[]);
  useEffect(()=>{if(!paused){const timer=setTimeout(()=>wake.current(),0);return()=>clearTimeout(timer);}},[paused]);
  return <p className="metadata-refresh" aria-label="Automatic episode checks">{message}</p>;
}
