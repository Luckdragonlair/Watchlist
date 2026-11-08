import {bucket,queue,chicagoDate,regular,released,type BingeSection,type Episode,type Preference,type Season,type Progress} from './model';
export const sectionNames:Record<BingeSection,string>={'watching-now':'Watching now','watch-soon':'Watch soon','everything-else':'Everything else','not-for-me':'Not for me'};
// Legacy libraries retain their previous manual order in Watch soon.
export const sectionOf=(preference:Preference|undefined):BingeSection=>preference?.bingeSection??'watch-soon';
export function nextBingeDate(episodes:Episode[],now:Date){
  return episodes.filter(e=>regular(e)&&!released(e,now)&&(e.airstamp||e.airdate)).map(e=>({date:e.airstamp?chicagoDate(new Date(e.airstamp)):e.airdate!,stamp:e.airstamp})).sort((a,b)=>(a.date+'/'+(a.stamp??'~')).localeCompare(b.date+'/'+(b.stamp??'~')))[0];
}
export function bingePlacement(episodes:Episode[],seasons:Season[],progress:Progress[],preference:Preference|undefined,now:Date):string|null{
  const section=sectionOf(preference);
  if(section==='not-for-me')return 'Not for me';
  if(bucket(episodes,seasons,progress,now)!=='Binge')return null;
  if(queue(episodes,progress,now).available.length)return sectionNames[readySection(episodes,progress,preference)];
  return nextBingeDate(episodes,now)?'Upcoming':'TBA';
}
/** Latest recorded regular-episode watch timestamp; undo removes that activity. */
export function lastBingeActivity(episodes:Episode[],progress:Progress[]):number|null{
 const ids=new Set(episodes.filter(regular).map(e=>e.id));let last:number|null=null;
 for(const p of progress){if(!ids.has(p.episodeId))continue;const at=Date.parse(p.watchedAt);if(Number.isFinite(at)&&(last===null||at>last))last=at;}
 return last;
}
export function readySection(episodes:Episode[],progress:Progress[],preference:Preference|undefined):BingeSection{
 const preferred=sectionOf(preference);if(preferred==='not-for-me')return preferred;
 return lastBingeActivity(episodes,progress)!==null?'watching-now':preferred;
}
