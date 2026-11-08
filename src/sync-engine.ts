import { liveQuery } from 'dexie';
import { repairUnknownAirdates,type WatchlistDB } from './db';
import { mergeLibraries,libraryContentKey,SyncConflict,LibraryValidationError,type SharedLibrary } from './sync-merge';
import { readLocalSync,acknowledgeSyncedState,emptyLibrary,syncAckConflictKey,readPendingUpload,acquirePendingUpload,clearPendingUpload,pausePendingUpload,type PendingUpload } from './sync-local';
export interface RemoteLibrary{revision:number;library:SharedLibrary}
export interface SyncTransport{
  validate?(library:SharedLibrary):void;
  read():Promise<RemoteLibrary|null>;
  write(revision:number,library:SharedLibrary):Promise<number>;
  watch(onRevision:(revision:number)=>void,onError:(error:unknown)=>void):()=>void;
}
export type SyncStatus={phase:'checking'|'syncing'|'saved'|'offline'|'error'|'conflict'|'invalid';message:string};
export class LibrarySync {
  private running=false;private again=false;private stopped=true;private unsubscribe:(()=>void)|null=null;
  private localSubscription:{unsubscribe:()=>void}|null=null;private retryTimer:ReturnType<typeof setTimeout>|null=null;
  private remoteRevision=-1;private conflict=false;private datesRepaired=false;
  private trigger=()=>{void this.sync();};
  constructor(private database:WatchlistDB,private transport:SyncTransport,private publish:(status:SyncStatus)=>void,private online=()=>navigator.onLine){}
  start(){
    if(!this.stopped)return;this.stopped=false;
    this.watch();
    this.localSubscription=liveQuery(()=>readLocalSync(this.database)).subscribe({next:()=>this.trigger(),error:()=>this.fail()});
    if(typeof window!=='undefined'){window.addEventListener('online',this.trigger);window.addEventListener('offline',this.trigger);}
    this.trigger();
  }
  stop(){this.stopped=true;this.unsubscribe?.();this.localSubscription?.unsubscribe();if(this.retryTimer)clearTimeout(this.retryTimer);if(typeof window!=='undefined'){window.removeEventListener('online',this.trigger);window.removeEventListener('offline',this.trigger);}}
  private watch(){this.unsubscribe?.();this.unsubscribe=this.transport.watch(revision=>{this.remoteRevision=revision;this.trigger();},()=>this.fail());}
  private fail(){if(this.stopped)return;this.publish({phase:this.online()?'error':'offline',message:this.online()?'Changes are saved on this device. Sync could not connect; it will retry.':'Offline. Changes are saved on this device and will sync when connected.'});if(!this.retryTimer)this.retryTimer=setTimeout(()=>{this.retryTimer=null;this.remoteRevision=-1;this.watch();this.trigger();},15000);}
  private async recoverUpload(intent:PendingUpload){
    const remote=await this.transport.read();if(this.stopped)return;
    if((await readPendingUpload(this.database))?.id!==intent.id)return;
    const current=remote?.revision??0;
    let committedRevision:number|undefined;
    if(current===intent.expectedRevision){
      this.transport.validate?.(intent.published);
      try{committedRevision=await this.transport.write(intent.expectedRevision,intent.published);}
      catch(error){if(error&&typeof error==='object'&&'name'in error&&error.name==='CloudRevisionConflict')return;throw error;}
      if(committedRevision!==intent.expectedRevision+1)throw new Error('Unexpected upload acknowledgement');
    }else if(current===intent.expectedRevision+1){
      if(remote&&libraryContentKey(remote.library)===libraryContentKey(intent.published))committedRevision=current;
      else{await clearPendingUpload(this.database,intent.id);return;}
    }else{
      const message='The shared library advanced while an upload was interrupted. Your local copy and pending upload are preserved. Choose a complete library before continuing.';
      if(await pausePendingUpload(this.database,intent.id,message))throw new SyncConflict(message);
      return;
    }
    if(this.stopped)return;
    const acknowledged=await acknowledgeSyncedState(this.database,intent.captured,intent.published,committedRevision,false,intent.id);
    if(acknowledged.conflict)throw new SyncConflict(acknowledged.conflict);
    this.remoteRevision=Math.max(this.remoteRevision,committedRevision);
  }
  async sync(){
    if(this.stopped||this.conflict)return;
    if(this.running){this.again=true;return;}
    if(!this.online()){this.fail();return;}
    this.running=true;
    try{
      if(!this.datesRepaired){await repairUnknownAirdates(this.database);this.datesRepaired=true;}
      let attempts=0;
      do{
        if(++attempts>8)throw new Error('The shared library is busy. Retry shortly.');
        this.again=false;
        const state=await readLocalSync(this.database),key=libraryContentKey(state.current);
        if(this.stopped)return;
        const pendingConflict=(await this.database.settings.get(syncAckConflictKey))?.value;
        if(typeof pendingConflict==='string')throw new SyncConflict(pendingConflict);
        const pending=await readPendingUpload(this.database);
        if(pending){await this.recoverUpload(pending);this.again=true;continue;}
        if(state.base&&this.remoteRevision>=0&&this.remoteRevision<=state.revision&&key===libraryContentKey(state.base)){
          this.publish({phase:'saved',message:'Up to date across your signed-in devices.'});continue;
        }
        this.publish({phase:'syncing',message:'Syncing saved changes…'});
        const remote=await this.transport.read();if(this.stopped)return;
        if(!remote&&state.base)throw new SyncConflict('The shared library is missing. Your local copy is preserved.');
        let next:SharedLibrary;
        if(!remote)next=state.current;
        else if(!state.base){
          if(!emptyLibrary(state.current)&&key!==libraryContentKey(remote.library))throw new SyncConflict('This device and the shared library both contain different data. Choose which complete library to use.');
          next=remote.library;
        }else next=mergeLibraries(state.base,state.current,remote.library);
        let revision=remote?.revision??0;
        let pendingId:string|undefined;
        if(!remote||libraryContentKey(next)!==libraryContentKey(remote.library)){
          this.transport.validate?.(next);
          const proposed={id:crypto.randomUUID(),expectedRevision:revision,captured:state.current,published:next};
          const intent=await acquirePendingUpload(this.database,proposed);
          if(intent.id!==proposed.id){this.again=true;continue;}
          if(this.stopped)return;
          pendingId=intent.id;
          try{revision=await this.transport.write(revision,next);}catch(error){if(error&&typeof error==='object'&&'name' in error&&error.name==='CloudRevisionConflict'){this.again=true;continue;}throw error;}
          if(revision!==intent.expectedRevision+1)throw new Error('Unexpected upload acknowledgement');
        }
        if(this.stopped)return;
        this.remoteRevision=Math.max(this.remoteRevision,revision);
        const acknowledged=await acknowledgeSyncedState(this.database,state.current,next,revision,false,pendingId);
        if(acknowledged.conflict)throw new SyncConflict(acknowledged.conflict);
        if(!acknowledged.applied||acknowledged.dirty){this.again=true;continue;}
        this.publish({phase:'saved',message:'Up to date across your signed-in devices.'});
      }while(this.again&&!this.stopped);
    }catch(error){
      if(error instanceof LibraryValidationError){this.publish({phase:'invalid',message:error.message});}
      else if(error instanceof SyncConflict){this.conflict=true;this.publish({phase:'conflict',message:error.message});}
      else if(error&&typeof error==='object'&&'name'in error&&error.name==='CloudLibraryLimitError'){
        if(this.retryTimer)clearTimeout(this.retryTimer);this.retryTimer=null;
        this.publish({phase:'error',message:'Library too large for this sync version. Your local library and backups are safe.'});
      }
      else this.fail();
    }finally{this.running=false;}
  }
  async resolve(choice:'device'|'cloud'){
    if(this.stopped||this.running)return;
    this.running=true;
    try{
      const state=await readLocalSync(this.database),previousIntent=await readPendingUpload(this.database),remote=await this.transport.read();
      if(this.stopped)return;
      if(!remote)throw new Error('Shared library unavailable');
      let next=remote.library,revision=remote.revision;
      let pendingId:string|undefined=previousIntent?.id;
      if(choice==='device'){
        // Explicit whole-library choice starts a new shared generation; older
        // queued edits on other devices must be reviewed before applying.
        next={...state.current,epoch:crypto.randomUUID()};
        this.transport.validate?.(next);
        const proposed={id:crypto.randomUUID(),expectedRevision:revision,captured:state.current,published:next};
        const intent=await acquirePendingUpload(this.database,proposed,previousIntent?.id??null);
        if(intent.id!==proposed.id)throw new Error('Pending upload changed during resolution');
        pendingId=intent.id;
        revision=await this.transport.write(revision,next);
      }
      if(this.stopped)return;
      const acknowledged=await acknowledgeSyncedState(this.database,state.current,next,revision,true,pendingId);
      if(acknowledged.conflict)throw new SyncConflict(acknowledged.conflict);
      if(!acknowledged.applied)throw new Error('Local library changed during resolution');
      this.remoteRevision=revision;this.conflict=false;
    }catch{this.publish({phase:'conflict',message:'The library changed while resolving this conflict. Your local copy is preserved. Export it and retry your choice.'});}
    finally{this.running=false;this.trigger();}
  }
}
