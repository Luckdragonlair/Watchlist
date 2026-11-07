import {db,libraryRevision,assertLibraryRevision,onboard} from './db';

export interface SetupSnapshot {showId:number;name:string;notes:string;revision:string;life:string}
export async function loadShowSetup(showId:number,database=db):Promise<SetupSnapshot>{
  return database.transaction('r',database.shows,database.preferences,database.settings,async()=>{
    const show=await database.shows.get(showId), preference=await database.preferences.get(showId);
    if(!show||!preference)throw new Error('This show is no longer in your library.');
    return {showId,name:show.name,notes:preference.notes,revision:await libraryRevision(database),life:String((await database.settings.get('syncLife:'+showId))?.value??'')};
  });
}
export async function saveShowSetup(snapshot:SetupSnapshot,notes:string,currentId?:number,now=new Date(),database=db){
  await database.transaction('rw',[database.shows,database.preferences,database.episodes,database.progress,database.settings],async()=>{
    await assertLibraryRevision(snapshot.revision,database);
    if(!await database.shows.get(snapshot.showId)||String((await database.settings.get('syncLife:'+snapshot.showId))?.value??'')!==snapshot.life)throw new Error('This show was removed or replaced. Your draft is kept; skip setup and reopen the show to continue.');
    const preference=await database.preferences.get(snapshot.showId);
    if(!preference)throw new Error('This show is no longer in your library.');
    if(preference.notes!==snapshot.notes)throw new Error('Saved notes changed on another device. Your draft is kept. Copy it if needed, then load the latest notes before saving.');
    if(currentId!==undefined)await onboard(snapshot.showId,currentId,now,database);
    if(notes!==preference.notes)await database.preferences.update(snapshot.showId,{notes});
  });
}
