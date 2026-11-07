const {randomUUID}=require('node:crypto');
const normal=s=>s.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
function applyMatches(before,entries,model,now=new Date()){
 const library=structuredClone(before),b=library.backup,applied=[],skipped=[];
 let order=Math.max(-1,...b.preferences.map(p=>p.order))+1;
 for(const entry of entries){
  const {bundle,sourceId,title}=entry,s=bundle.show;
  if(/\bsilo\b/i.test(title)||/\bsilo\b/i.test(s.name))throw new Error('Silo is excluded.');
  if(normal(title)!==normal(s.name))throw new Error('Alias/part matching requires owner approval: '+title);
  const source=b.sources.find(x=>x.id===sourceId);
  if(!source){skipped.push({title,reason:'source removed since review'});continue;}
  const rows=entry.rows.map(r=>source.rows.find(x=>x.id===r.id));
  if(rows.some((r,i)=>!r||r.title!==title||r.state!=='pending'||r.season!==entry.rows[i].season||r.sourceCategory!==entry.rows[i].category||r.rawTitle!==entry.rows[i].rawTitle)){skipped.push({title,reason:'source rows changed since review'});continue;}
  if(b.shows.some(x=>x.id===s.id)){skipped.push({title,reason:'show already in library; existing metadata/history left unchanged'});continue;}
  if(rows.some(r=>r.sourceCategory==='Watched'&&r.season===undefined))throw new Error('Unscoped watched assertion: '+title);
  if(rows.some(r=>r.season!==undefined&&!bundle.seasons.some(x=>x.number===r.season)))throw new Error('Missing source season: '+title);
  if(bundle.episodes.some(e=>e.showId!==s.id)||bundle.seasons.some(x=>x.showId!==s.id))throw new Error('Mismatched provider ownership: '+title);
  if(bundle.episodes.some(e=>b.episodes.some(old=>old.id===e.id))||bundle.seasons.some(x=>b.seasons.some(old=>old.id===x.id)))throw new Error('Conflicting provider records: '+title);
  b.shows.push(structuredClone(s));b.seasons.push(...structuredClone(bundle.seasons));b.episodes.push(...structuredClone(bundle.episodes));
  b.preferences.push({showId:s.id,order:order++,notes:rows.map(r=>`Source: ${r.rawTitle??r.title}; ${r.sourceCategory??'Unclassified'}${r.sourceStatus?`; ${r.sourceStatus} (unverified)`:''}${r.notes?`; ${r.notes}`:''}`).join('\n')});
  library.lifecycles[String(s.id)]=randomUUID();
  const watchedSeasons=new Set(rows.filter(r=>r.sourceCategory==='Watched').map(r=>r.season));
  for(const e of bundle.episodes.filter(e=>model.regular(e)&&model.released(e,now)&&watchedSeasons.has(e.season)))b.progress.push({episodeId:e.id,showId:s.id,watchedAt:now.toISOString()});
  const ids=new Set(rows.map(r=>r.id));source.rows=source.rows.map(r=>ids.has(r.id)?{...r,state:'imported',showId:s.id}:r);
  applied.push({title,showId:s.id,rows:rows.map(r=>r.id),seasons:bundle.seasons.map(x=>x.number),episodes:bundle.episodes.length});
 }
 b.exportedAt=now.toISOString();
 // Existing personal records must be identical, not merely have the same counts.
 for(const [table,key] of [['shows','id'],['seasons','id'],['episodes','id'],['preferences','showId'],['progress','episodeId']])for(const original of before.backup[table]){
  const actual=b[table].find(x=>x[key]===original[key]);if(JSON.stringify(actual)!==JSON.stringify(original))throw new Error('Existing '+table+' changed unexpectedly.');
 }
 for(const [key,value] of Object.entries(before.lifecycles))if(library.lifecycles[key]!==value)throw new Error('Existing lifecycle changed.');
 return {library,applied,skipped};
}
module.exports={applyMatches};
