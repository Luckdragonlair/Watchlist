import {db,assertLibraryRevision} from './db';
import type {BingeSection} from './model';
import {sectionOf} from './binge-model';
export {sectionOf,sectionNames,nextBingeDate,bingePlacement} from './binge-model';
export async function setBingeSection(showId:number,section:BingeSection,revision:string,life:string,database=db){
  await database.transaction('rw',database.shows,database.preferences,database.settings,async()=>{
    await assertLibraryRevision(revision,database);
    if(!await database.shows.get(showId)||String((await database.settings.get('syncLife:'+showId))?.value??'')!==life)throw new Error('This show was removed or replaced. Reopen it before changing its section.');
    const preference=await database.preferences.get(showId);if(!preference)throw new Error('This show is no longer in your library.');
    if(sectionOf(preference)===section)return;
    const orders=(await database.preferences.toArray()).map(p=>p.order);
    await database.preferences.update(showId,{bingeSection:section,order:Math.max(-1,...orders)+1});
  });
}
