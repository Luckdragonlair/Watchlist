import { useState, useSyncExternalStore } from 'react';
import { installApp, pwaSnapshot, subscribePwa, updateApp } from './pwa';
export function PwaStatus(){
  const state=useSyncExternalStore(subscribePwa,pwaSnapshot);
  const [instructions,setInstructions]=useState(false);
  if(!state.enabled)return null;
  return <section className="app-status" aria-label="App availability">
    <p role="status">{!state.online?'Offline · Saved shows and progress still work.':state.offlineReady?'Available offline · Search and refresh need internet.':state.error?'Offline setup did not finish. Reopen Watchlist online to try again.':state.supported?'Preparing offline access…':'Offline installation is unavailable in this browser.'}</p>
    {state.updateAvailable&&<p>Update available. Save any open notes first. <button onClick={updateApp}>Update and reload</button></p>}
    {!state.installed&&<button onClick={async()=>{const result=await installApp();setInstructions(result==='unavailable');}}>{state.installAvailable?'Install app':'How to install'}</button>}
    {instructions&&<p>Use your browser’s Install app option. If this browser does not offer it, open this same address in Microsoft Edge or Chrome and install it there. Each browser keeps its own library; use Export and Restore backup to transfer progress.</p>}
  </section>;
}
