import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { masterSource, normalizeMaster } from '../src/master.ts';
const raw = readFileSync(new URL('../originals/Project Watchlist Master List.txt',import.meta.url),'utf8');
const sha = createHash('sha256').update(readFileSync(new URL('../originals/Project Watchlist Master List.txt',import.meta.url))).digest('hex');
const source=masterSource(raw,`master-${sha}`), normalized=normalizeMaster(raw);
// Deliberate owner removals apply only to this exact historical source and row identity.
const removals=JSON.parse(readFileSync(new URL('../Notes/MASTER_REMOVALS.json',import.meta.url),'utf8'));
if(removals.sourceSHA256!==sha)throw new Error('Master source changed; review removal identities before regenerating.');
source.rows=source.rows.filter(row=>!removals.rows.some(removed=>removed.id===row.id&&removed.rawTitle===row.rawTitle));
mkdirSync(new URL('../public',import.meta.url),{recursive:true});
writeFileSync(new URL('../public/master-working.json',import.meta.url),JSON.stringify(source,null,2)+'\n');
const counts={sourceSHA256:sha,totalInstallments:source.rows.length,distinctTitles:new Set(source.rows.map(r=>r.title)).size,heldOutSiloRows:normalized.excluded.length,needsReview:source.rows.filter(r=>r.state==='review').map(r=>r.rawTitle),categories:Object.fromEntries(['Weekly','Binge','Watched'].map(c=>[c,source.rows.filter(r=>r.sourceCategory===c).length])),ignoredMarkers:normalized.markers};
writeFileSync(new URL('../Notes/MASTER_IMPORT_AUDIT.json',import.meta.url),JSON.stringify(counts,null,2)+'\n');
console.log(JSON.stringify(counts,null,2));
