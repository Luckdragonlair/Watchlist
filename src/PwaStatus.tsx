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
    {instructions&&<p>Firefox on Windows: use the web apps button in the address bar to add Watchlist to your taskbar and Start menu. Firefox on Android: open the browser menu and choose Install. Edge and Chrome: use Install app when offered. Each browser and address keeps its own library; use Export and Restore backup to transfer progress. Phone access needs a hosted Watchlist address; the current PC address does not work on your phone.</p>}
  </section>;
}
