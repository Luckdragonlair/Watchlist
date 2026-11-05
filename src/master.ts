import type { ImportRow, Source } from './model';
import { isSilo } from './importer.ts';
export function normalizeMaster(raw: string) {
  let category: ImportRow['sourceCategory'] = 'Binge', weekday = '', status = '';
  let last: ImportRow | undefined;
  const rows: ImportRow[] = [], excluded: ImportRow[] = [], markers: string[] = [];
  const days = new Set(['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']);
  for (const [lineIndex, text] of raw.split(/\r?\n/).entries()) {
    const line = text.trim(); if (!line) continue;
    if (['WEEKLY','BINGE','WATCHED'].includes(line)) {category = line === 'WEEKLY' ? 'Weekly' : line === 'WATCHED' ? 'Watched' : 'Binge'; weekday=''; status=''; last=undefined; continue;}
    if (days.has(line)) {weekday=line; continue;}
    if (['Renewed / Continuing','Unknown / TBA','Cancelled / Ended'].includes(line)) {status=line; last=undefined; continue;}
    if (line === 'None' || line === 'New Group') {markers.push(line); continue;}
    const note = /^(?:Season \d+ confirmed|Continues with |Queen of the Damned continuation|Creators have plans|No official |Ended$|Cancelled(?: after|$)|Final season \/)/i.test(line);
    if (category === 'Watched' && note) {if (!last) throw new Error(`Unattached note on line ${lineIndex+1}`); last.notes += `${last.notes ? '\n' : ''}${line}`; continue;}
    const match = line.match(/^(.*?)\s+S(\d+)(?:\s+(.*))?$/);
    const title = match ? match[1] : line;
    const row: ImportRow = {id: String(lineIndex+1), title, rawTitle:line, season:match ? Number(match[2]) : undefined, sourceCategory:category, sourceWeekday:category==='Weekly'?weekday:undefined, sourceStatus:status || undefined, notes:match?.[3] ?? '', state:isSilo(title)?'excluded':/^Re$/i.test(title)?'review':'pending'};
    (row.state==='excluded'?excluded:rows).push(row); last=row;
  }
  return {rows,excluded,markers};
}
export function masterSource(raw: string, id: string): Source {
  return {id,name:'Project Watchlist Master List.txt — working copy',raw:'Original preserved separately in originals/ and the project root. Source assertions are unverified.',importedAt:new Date().toISOString(),rows:normalizeMaster(raw).rows};
}
