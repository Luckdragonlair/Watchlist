type InstallPrompt=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:'accepted'|'dismissed'}>};
type State={enabled:boolean;supported:boolean;online:boolean;offlineReady:boolean;updateAvailable:boolean;installAvailable:boolean;installed:boolean;error:boolean};
const enabled=import.meta.env.PROD;
let state:State={enabled,supported:'serviceWorker' in navigator&&window.isSecureContext,online:navigator.onLine,offlineReady:false,updateAvailable:false,installAvailable:false,installed:window.matchMedia('(display-mode: standalone)').matches,error:false};
const listeners=new Set<()=>void>();
let registration:ServiceWorkerRegistration|undefined,prompt:InstallPrompt|undefined,started=false,reloadRequested=false;
function change(patch:Partial<State>){state={...state,...patch};for(const listener of listeners)listener();}
export const pwaSnapshot=()=>state;
export const subscribePwa=(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};};
export async function initializePwa(){
  if(started||!enabled)return;started=true;
  window.addEventListener('online',()=>change({online:true}));window.addEventListener('offline',()=>change({online:false}));
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();prompt=event as InstallPrompt;change({installAvailable:true});});
  window.addEventListener('appinstalled',()=>{prompt=undefined;change({installed:true,installAvailable:false});});
  if(!state.supported)return;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{change({offlineReady:true,updateAvailable:!!registration?.waiting});if(reloadRequested)window.location.reload();});
  try{
    const scope=import.meta.env.BASE_URL;
    const previous=await navigator.serviceWorker.getRegistration(scope);
    try{registration=await navigator.serviceWorker.register(`${scope}service-worker.js`,{scope,updateViaCache:'none'});}
    catch(error){if(previous?.active)registration=previous;else throw error;}
    const check=()=>change({updateAvailable:!!registration?.waiting});
    check();registration.addEventListener('updatefound',()=>{const worker=registration?.installing;worker?.addEventListener('statechange',()=>{check();if(worker.state==='redundant'&&!registration?.active)change({error:true});});});
    await navigator.serviceWorker.ready;change({offlineReady:true,error:false});check();
    void registration.update().catch(()=>{});
  }catch{change({error:true});}
}
export function updateApp(){if(registration?.waiting){reloadRequested=true;registration.waiting.postMessage({type:'SKIP_WAITING'});}}
export async function installApp():Promise<'accepted'|'dismissed'|'unavailable'>{
  if(!prompt)return'unavailable';
  const event=prompt;prompt=undefined;change({installAvailable:false});
  try{await event.prompt();const choice=await event.userChoice;if(choice.outcome==='accepted')change({installed:true});return choice.outcome;}catch{return'unavailable';}
}
