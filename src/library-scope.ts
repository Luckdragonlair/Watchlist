let ownerUid:string|null=null;
export function configureHostedLibrary(uid:string) {
  if(!/^[A-Za-z0-9_-]{1,128}$/.test(uid)) throw new Error('Invalid library owner.');
  if(ownerUid!==null&&ownerUid!==uid) throw new Error('Reload Watchlist before changing accounts.');
  ownerUid=uid;
}
export function libraryDatabaseName(){return ownerUid===null?'watchlist-v01':`watchlist-cloud-v01-${ownerUid}`;}
