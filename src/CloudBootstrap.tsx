import { useEffect, useState, type ComponentType } from 'react';
import { initializeApp } from 'firebase/app';
import { GoogleAuthProvider, getAuth, onAuthStateChanged, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, type User } from 'firebase/auth';
import { readCloudConfig } from './cloud-config';
import { configureHostedLibrary } from './library-scope';
import { PwaStatus } from './PwaStatus';
import { useSameWindowSignIn, signInErrorMessage } from './auth-flow';

const config=readCloudConfig(import.meta.env);
const auth=config?getAuth(initializeApp(config)):null;
export default function CloudBootstrap(){
  const [user,setUser]=useState<User|null>(null);
  const [ready,setReady]=useState(false);
  const [checkingSlow,setCheckingSlow]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [metadataPaused,setMetadataPaused]=useState(true);
  const [LocalApp,setLocalApp]=useState<ComponentType<{metadataPaused?:boolean}>|null>(null);
  const [SyncView,setSyncView]=useState<ComponentType<{uid:string;onMetadataPause?:(paused:boolean)=>void}>|null>(null);
  useEffect(()=>{
    if(!auth)return;
    let active=true;
    const checkingTimer=setTimeout(()=>{if(active)setCheckingSlow(true);},10000);
    void getRedirectResult(auth).catch(error=>{if(active)setError(signInErrorMessage(error));});
    const unsubscribe=onAuthStateChanged(auth,async next=>{
      clearTimeout(checkingTimer);setCheckingSlow(false);
      setUser(next);setReady(true);setMetadataPaused(true);setLocalApp(null);setSyncView(null);
      if(!next||!config||next.uid!==config.ownerUid)return;
      try {
        configureHostedLibrary(next.uid);
        const [module,syncModule]=await Promise.all([import('./App'),import('./CloudSyncStatus')]);
        if(active&&auth.currentUser?.uid===next.uid){setLocalApp(()=>module.App);setSyncView(()=>syncModule.CloudSyncStatus);}
      } catch {if(active)setError('The saved app could not be opened. Please reload Watchlist.');}
    },()=>{clearTimeout(checkingTimer);setCheckingSlow(false);setReady(true);setError('Sign-in could not be checked. Please reconnect and reload.');});
    return ()=>{active=false;clearTimeout(checkingTimer);unsubscribe();};
  },[]);
  if(!auth||!config)return <main><h1>Watchlist setup needed</h1><p>The hosted configuration is missing. Your local Watchlist is unchanged.</p></main>;
  async function login(){
    setError('');
    if(!navigator.onLine){setError('Connect to the internet to sign in with Google.');return;}
    setBusy(true);
    try{
      if(useSameWindowSignIn(location.origin,config!.authDomain))await signInWithRedirect(auth!,new GoogleAuthProvider());
      else await signInWithPopup(auth!,new GoogleAuthProvider());
    }catch(error){setError(signInErrorMessage(error));}
    finally{setBusy(false);}
  }
  async function logout(){setBusy(true);setLocalApp(null);setSyncView(null);try{await signOut(auth!);location.reload();}catch{setBusy(false);setError('Sign-out did not finish. Please retry.');}}
  return <>{!LocalApp&&<PwaStatus/>}<details className="cloud-account" open={!LocalApp}><summary>Account <span>{user?.email??'Sign in'}</span></summary><section aria-label="Cloud account"><h1>Watchlist account</h1>
    {!ready?<p>{checkingSlow?<>Sign-in is taking longer than expected. Accept any app update above, then <a href="/">reload Watchlist</a>. If it still stalls, open it directly in Firefox.</>:'Checking sign-in…'}</p>:!user?<><p>Sign in with your Google account to open this device’s private library.</p><button disabled={busy} onClick={login}>{busy?'Opening Google…':'Sign in with Google'}</button></>:<><p>Signed in as {user.email??'Google account'}</p><button disabled={busy} onClick={logout}>Sign out</button>{user.uid!==config.ownerUid?<p>This account does not have access to this Watchlist.</p>:<p>Your library syncs while Watchlist is open and connected. Offline changes stay on this device until it reconnects.</p>}</>}
    {user&&!config.ownerUid&&<p>Owner setup is pending. Your account ID is <code>{user.uid}</code>. No library has been opened or uploaded.</p>}
    {error&&<p role="alert">{error}</p>}
  </section></details>{user?.uid===config.ownerUid&&LocalApp&&SyncView&&<><SyncView uid={user.uid} onMetadataPause={setMetadataPaused}/><LocalApp metadataPaused={metadataPaused}/></>}</>;
}
