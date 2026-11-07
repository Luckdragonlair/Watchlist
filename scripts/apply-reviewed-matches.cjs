const fs=require('node:fs'),path=require('node:path');
const {root,api,validators,documentPath,readShared}=require('./shared-library-cli.cjs');
const {applyMatches}=require('./bulk-match-data.cjs');const {makeCommit}=require('./bulk-match-commit.cjs');
const dir=path.join(root,'originals/bulk-matching-2026-11-07');
(async()=>{
 if(!process.argv.includes('--apply'))throw new Error('Live application requires the explicit --apply flag and owner approval. Use the saved offline preview for review.');
 let plan;
 if(process.argv.includes('--owner-selected')){
   const selected=JSON.parse(fs.readFileSync(path.join(dir,'owner-selected-batch-1.json'),'utf8'));
   const expected=[['One Piece',46065],['Avatar: The Last Airbender',38753],['Dark Matter',61315]];
   if(JSON.stringify(selected.choices)!==JSON.stringify(expected)||selected.entries.length!==3||selected.held.length)throw new Error('Owner-selected batch changed or has unresolved seasons. Stop for review.');
   for(const e of selected.entries){if(!expected.some(([title,id])=>title===e.title&&id===e.bundle.show.id))throw new Error('Unexpected selected show.');fs.writeFileSync(path.join(dir,'bundles',e.bundle.show.id+'.json'),JSON.stringify(e.bundle));}
   plan={clear:selected.entries.map(({bundle,...e})=>({...e,candidate:{id:bundle.show.id}})),review:[]};
 }else{
   plan=JSON.parse(fs.readFileSync(path.join(dir,'validated-match-plan.json'),'utf8'));
   if(plan.clear.length!==138||plan.review.length!==59)throw new Error('This is not the owner-approved 138/59 batch. Stop for review.');
 }
 const before=await readShared(),model=await validators();
 const baseline=JSON.parse(fs.readFileSync(path.join(dir,'baseline.json'),'utf8'));
 if(before.library.epoch!==baseline.library.epoch)throw new Error('Library was restored since review. Prepare a new preview; no changes applied.');
 const entries=plan.clear.map(e=>({...e,bundle:JSON.parse(fs.readFileSync(path.join(dir,'bundles',e.candidate.id+'.json'),'utf8'))}));
 if(entries.some(e=>e.bundle.show.id!==e.candidate.id))throw new Error('Candidate ID mismatch.');
 const result=applyMatches(before.library,entries,model);model.validateCloudUpload(result.library);
 const commit=makeCommit(documentPath,before.manifest,result.library);
 const preview={baselineRevision:before.revision,showsBefore:before.library.backup.shows.length,showsAfter:result.library.backup.shows.length,episodesAfter:result.library.backup.episodes.length,bytes:commit.bytes,applied:result.applied,skipped:result.skipped,held:plan.review.map(g=>({title:g.title,reason:g.reason,missingSeasons:g.missingSeasons}))};
 fs.writeFileSync(path.join(dir,'apply-preview.json'),JSON.stringify(preview,null,2));
 console.log(JSON.stringify({mode:process.argv.includes('--apply')?'apply':'preview',baselineRevision:before.revision,showsBefore:preview.showsBefore,showsAfter:preview.showsAfter,episodesAfter:preview.episodesAfter,bytes:preview.bytes,matched:result.applied.length,skipped:result.skipped.length,held:plan.review.length}));
 if(!process.argv.includes('--apply'))return;
 if(!result.applied.length)throw new Error('No new clear matches to apply.');
 fs.writeFileSync(path.join(dir,'before-apply-'+Date.now()+'.json'),JSON.stringify(before,null,2));
 await (await api()).post('/projects/genre-watchlist/databases/(default)/documents:commit',{writes:commit.writes});
 const after=await readShared();
 if(after.revision===commit.revision&&after.manifest.fields.payloadHash.stringValue!==commit.hash)throw new Error('Readback checksum mismatch; do not retry automatically.');
 for(const item of result.applied)if(!after.library.backup.shows.some(s=>s.id===item.showId))throw new Error('Readback missing a matched show; do not retry automatically.');
 fs.writeFileSync(path.join(dir,process.argv.includes('--owner-selected')?'owner-selected-receipt.json':'apply-receipt.json'),JSON.stringify({...preview,committedRevision:commit.revision,readbackRevision:after.revision,verifiedAt:new Date().toISOString()},null,2));
 console.log('Applied clear matches and verified server readback. Existing personal records preserved; held items untouched.');
 await require('./export-current-library.cjs').exportOnce();
})().catch(e=>{console.error(e.message);process.exitCode=1;});
