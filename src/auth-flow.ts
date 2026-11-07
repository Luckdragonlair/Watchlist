export function useSameWindowSignIn(origin:string,authDomain:string):boolean {
  // Keeping the hosted app and Firebase auth helper on the same origin also
  // avoids third-party storage dependencies in Firefox's redirect flow.
  return origin===`https://${authDomain}`;
}
export function signInErrorMessage(error:unknown):string {
  const code=error&&typeof error==='object'&&'code' in error?String(error.code):'';
  switch(code){
    case 'auth/popup-blocked':return 'The sign-in window was blocked. Open Watchlist in Firefox and try again.';
    case 'auth/popup-closed-by-user':return 'The Google sign-in window closed before finishing. Try again, or open Watchlist in Firefox.';
    case 'auth/cancelled-popup-request':return 'Another sign-in attempt is already open. Finish it or try again.';
    case 'auth/unauthorized-domain':return 'Sign-in is not enabled for this Watchlist address yet. Please report this message so the address can be enabled.';
    case 'auth/operation-not-allowed':return 'Google sign-in is not enabled for this project yet. Please report this message.';
    case 'auth/network-request-failed':return 'Google sign-in could not connect. Check your internet connection and try again.';
    case 'auth/web-storage-unsupported':return 'Google sign-in needs browser storage. Open Watchlist in a normal Firefox window and try again.';
    default:return 'Google sign-in did not finish. Try opening Watchlist directly in Firefox and signing in there.';
  }
}
