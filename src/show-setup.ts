import {db,libraryRevision,assertLibraryRevision,onboard,markCaughtUp} from './db';
import {genresOf} from './genres';

export interface SetupSnapshot {showId:number;name:string;notes:string;revision:string;life:string;genres?:string[];primaryGenre?:string}
export async function loadShowSetup(showId:number,database=db):Promise<SetupSnapshot>{
  return database.transaction('r',database.shows,database.preferences,database.settings,async()=>{
    const show=await database.shows.get(showId), preference=await database.preferences.get(showId);
    if(!show||!preference)throw new Error('This show is no longer in your library.');
    return {showId,name:show.name,notes:preference.notes,genres:genresOf(show.genres),primaryGenre:preference.primaryGenre,revision:await libraryRevision(database),life:String((await database.settings.get('syncLife:'+showId))?.value??'')};
  });
}
export async function saveShowSetup(snapshot:SetupSnapshot,notes:string,currentId?:number|'caught-up',now=new Date(),database=db,primaryChoice?:string){
  await database.transaction('rw',[database.shows,database.preferences,database.episodes,database.progress,database.settings],async()=>{
    await assertLibraryRevision(snapshot.revision,database);
    const show=await database.shows.get(snapshot.showId);
    if(!show||String((await database.settings.get('syncLife:'+snapshot.showId))?.value??'')!==snapshot.life)throw new Error('This show was removed or replaced. Your draft is kept; skip setup and reopen the show to continue.');
    const preference=await database.preferences.get(snapshot.showId);
    if(!preference)throw new Error('This show is no longer in your library.');
    if(preference.notes!==snapshot.notes)throw new Error('Saved notes changed on another device. Your draft is kept. Copy it if needed, then load the latest notes before saving.');
    if(primaryChoice!==undefined){
      if(preference.primaryGenre!==snapshot.primaryGenre)throw new Error('The saved primary genre changed on another device. Your draft is kept. Load the latest setup before saving.');
      if(!primaryChoice.trim()||primaryChoice.length>80||(!genresOf(show.genres).includes(primaryChoice)&&primaryChoice!==preference.primaryGenre))throw new Error('The genre options changed. Your draft is kept. Load the latest setup and choose a listed genre before saving.');
    }
    if(currentId==='caught-up')await markCaughtUp(snapshot.showId,now,database);
    else if(currentId!==undefined)await onboard(snapshot.showId,currentId,now,database);
    if(notes!==preference.notes||(primaryChoice!==undefined&&primaryChoice!==preference.primaryGenre))await database.preferences.update(snapshot.showId,{notes,...(primaryChoice===undefined?{}:{primaryGenre:primaryChoice})});
  });
}
