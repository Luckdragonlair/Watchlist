// Read-only export: never writes to Firestore or the preserved master files.
const fs=require('node:fs'),path=require('node:path');
const {root,readShared,validators}=require('./shared-library-cli.cjs');
const folder=path.join(root,'Library');
const esc=value=>String(value??'').replace(/[\\`*_\[\]<>]/g,'\\$&').replace(/\r?\n/g,' ');
function renderLibrary(library,revision,now,model){
 const b=library.backup;
 const lines=['# Watchlist — current app library','',`Updated: ${now.toISOString()} · Cloud revision ${revision}`,'','This is a current app export. The original master and the separate master Page are preserved independently. Unmatched source assertions remain unverified.',''];
 const byShow=new Map();for(const e of b.episodes){if(!byShow.has(e.showId))byShow.set(e.showId,[]);byShow.get(e.showId).push(e);}
 const {regular}=model;
 const seen=new Set(b.progress.map(p=>p.episodeId));
 const sections=model.bingePlacement?['Weekly','Watching now','Watch soon','Everything else','Upcoming','TBA','Not for me','Watched']:['Weekly','Binge','Watched'];
 for(const section of sections){
  if(section==='Watching now')lines.push('## Binge','');
  lines.push((['Weekly','Binge','Watched'].includes(section)?'## ':'### ')+section,'');
  for(const s of [...b.shows].sort((a,c)=>{const pa=b.preferences.find(p=>p.showId===a.id),pc=b.preferences.find(p=>p.showId===c.id);if(['Watching now','Watch soon'].includes(section))return (pa?.order??0)-(pc?.order??0)||(model.compareTitles?.(a.name,c.name)??a.name.localeCompare(c.name));if(section==='Upcoming')return (model.nextBingeDate(byShow.get(a.id)??[],now)?.date??'').localeCompare(model.nextBingeDate(byShow.get(c.id)??[],now)?.date??'')||(model.compareTitles?.(a.name,c.name)??a.name.localeCompare(c.name));return model.compareTitles?.(a.name,c.name)??a.name.localeCompare(c.name);})){
   const episodes=byShow.get(s.id)??[],seasons=b.seasons.filter(x=>x.showId===s.id);
   const preference=b.preferences.find(p=>p.showId===s.id),placement=model.bingePlacement?.(episodes,seasons,b.progress,preference,now);
   if(section==='Weekly'){if(model.bucket(episodes,seasons,b.progress,now)!=='Weekly'||preference?.bingeSection==='not-for-me')continue;}else if(section==='Watched'){if(model.bucket(episodes,seasons,b.progress,now)!=='Watched'&&!episodes.some(e=>seen.has(e.id)))continue;}else if(model.bingePlacement?placement!==section:model.bucket(episodes,seasons,b.progress,now)!==section)continue;
   const next=model.queue(episodes,b.progress,now).next;
   lines.push(`- **${esc(model.filedTitle?.(s.name)??s.name)}** | ${esc(s.service??'Service unknown')} | ${episodes.filter(e=>regular(e)&&seen.has(e.id)).length}/${episodes.filter(regular).length} watched${next?` | Next: S${next.season} E${next.number} — ${esc(next.name)}`:''}`);
   const notes=b.preferences.find(p=>p.showId===s.id)?.notes;if(notes)lines.push('  - Notes: '+esc(notes));
  }
  lines.push('');
 }
 lines.push('## Source entries awaiting a match','');
 for(const source of b.sources)for(const row of source.rows.filter(r=>r.state==='pending'||r.state==='review'))lines.push(`- ${esc(row.rawTitle??row.title)} | ${row.state} | source: ${esc(row.sourceCategory??'Unclassified')}${row.notes?' | '+esc(row.notes):''}`);
 lines.push('','The JSON companion preserves every episode, saved note, source entry and watched timestamp. This Markdown is a readable summary; source files and provider availability are not silently rewritten.','');
 return lines.join('\n');
}
function atomic(file,text){const temp=file+'.tmp';fs.writeFileSync(temp,text);fs.renameSync(temp,file);}
async function exportOnce(){
 fs.mkdirSync(folder,{recursive:true});
 const statusPath=path.join(folder,'export-status.json');let prior;try{prior=JSON.parse(fs.readFileSync(statusPath,'utf8'));}catch{}
 if(prior?.rendererVersion!==2||!fs.existsSync(path.join(folder,'Watchlist Current.json'))||!fs.existsSync(path.join(folder,'Watchlist Current.md')))prior=undefined;
 const data=await readShared(prior);if(!data)return false;
 const now=new Date(),backup={...data.library.backup,exportedAt:now.toISOString()};
 atomic(path.join(folder,'Watchlist Current.json'),JSON.stringify(backup,null,2)+'\n');
 atomic(path.join(folder,'Watchlist Current.md'),renderLibrary(data.library,data.revision,now,await validators()));
 atomic(statusPath,JSON.stringify({rendererVersion:2,revision:data.revision,payloadHash:data.manifest.fields.payloadHash.stringValue,exportedAt:now.toISOString()},null,2)+'\n');
 console.log(`Exported cloud revision ${data.revision}: ${backup.shows.length} shows to ${folder}`);return true;
}
async function main(){
 if(!process.argv.includes('--watch')){await exportOnce();return;}
 const lock=path.join(root,'.tools/library-export.pid');fs.mkdirSync(path.dirname(lock),{recursive:true});
 try{const pid=Number(fs.readFileSync(lock,'utf8'));if(pid&&pid!==process.pid){try{process.kill(pid,0);throw new Error('A library export watcher is already running.');}catch(e){if(e.message.includes('already running'))throw e;}}}catch(e){if(e.message.includes('already running'))throw e;}
 fs.writeFileSync(lock,String(process.pid));
 for(;;){try{await exportOnce();}catch(e){console.error(new Date().toISOString()+': '+e.message);}await new Promise(r=>setTimeout(r,60000));}
}
module.exports={renderLibrary,exportOnce};
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
