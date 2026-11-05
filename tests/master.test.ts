import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { normalizeMaster } from '../src/master';
import { isSilo } from '../src/importer';
it('normalizes the real source without fabricating title rows from notes or headings',()=>{
  const raw=readFileSync(new URL('../originals/Project Watchlist Master List.txt',import.meta.url),'utf8');
  const {rows,excluded,markers}=normalizeMaster(raw);
  expect(rows).toHaveLength(301); expect(new Set(rows.map(r=>r.title)).size).toBe(208);
  expect(excluded).toHaveLength(5); expect(rows.some(r=>isSilo(r.title))).toBe(false);
  expect(rows.filter(r=>r.state==='review').map(r=>r.rawTitle)).toEqual(['Re S3','Re S4']);
  expect(rows.some(r=>/^(Season \d+ confirmed|None|New Group|WEEKLY)$/.test(r.title))).toBe(false);
  expect(markers).toEqual(['None','None','New Group']);
  expect(rows.find(r=>r.rawTitle==='Severance S2')).toMatchObject({title:'Severance',season:2,sourceCategory:'Watched',notes:'Season 3 confirmed'});
  expect(rows.find(r=>r.rawTitle==='VisionQuest S1')).toMatchObject({sourceCategory:'Weekly',sourceWeekday:'Wednesday'});
  expect(rows.find(r=>r.rawTitle==='Dark Matter S2')?.notes).toContain('Apple has not renewed');
});
