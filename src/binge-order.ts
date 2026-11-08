import {assertLibraryRevision,db} from './db';
import {bingePlacement,sectionNames,lastBingeActivity,sectionOf} from './binge-model';
import type {BingeSection} from './model';
export type OrderedSection='watching-now'|'watch-soon';
export interface OrderSnapshot {revision:string;section:OrderedSection;started?:boolean;members:{id:number;order:number;life:string;activity?:number|null;manual?:boolean;storedSection?:BingeSection}[]}
export function moveInOrder(ids:number[],id:number,target:number){const next=[...ids],from=next.indexOf(id),to=next.indexOf(target);if(from<0||to<0)throw new Error('The show list changed. Try the move again.');next.splice(to,0,...next.splice(from,1));return next;}
/** Shared atomic path for drag, keyboard and arrow moves. No personal fields are replaced. */
export async function saveBingeOrder(snapshot:OrderSnapshot,ids:number[],database=db,now=new Date(),manual=true){
 if(!['watching-now','watch-soon'].includes(snapshot.section)||new Set(snapshot.members.map(m=>m.id)).size!==snapshot.members.length||new Set(ids).size!==ids.length||ids.length!==snapshot.members.length||snapshot.members.some(m=>!ids.includes(m.id)))throw new Error('Invalid show order. Nothing was saved.');
 await database.transaction('rw',[database.shows,database.preferences,database.settings,database.episodes,database.seasons,database.progress],async()=>{
  await assertLibraryRevision(snapshot.revision,database);
  const [shows,preferences,episodes,seasons,progress]=await Promise.all([database.shows.toArray(),database.preferences.toArray(),database.episodes.toArray(),database.seasons.toArray(),database.progress.toArray()]);
  const current=shows.filter(s=>bingePlacement(episodes.filter(e=>e.showId===s.id),seasons.filter(x=>x.showId===s.id),progress,preferences.find(p=>p.showId===s.id),now)===sectionNames[snapshot.section]&&(lastBingeActivity(episodes.filter(e=>e.showId===s.id),progress)!==null)===!!snapshot.started);
  if(current.length!==ids.length||current.some(s=>!ids.includes(s.id)))throw new Error('The show list changed while you were moving a card. Try again.');
  for(const member of snapshot.members){
   const pref=preferences.find(p=>p.showId===member.id),life=String((await database.settings.get('syncLife:'+member.id))?.value??'');
   if(!pref||pref.order!==member.order||sectionOf(pref)!==(member.storedSection??snapshot.section)||!!pref.bingeManualOrder!==!!member.manual||lastBingeActivity(episodes.filter(e=>e.showId===member.id),progress)!==(member.activity??null)||life!==member.life)throw new Error('The saved order changed while you were moving a card. Try again.');
  }
  for(const [order,id] of ids.entries())await database.preferences.update(id,{order,...(snapshot.started?{bingeManualOrder:manual}:{})});
 });
}
