import {createRequire} from 'node:module';
import {expect,it} from 'vitest';
import * as model from '../src/model';
import * as bingeModel from '../src/binge-model';
import * as titles from '../src/titles';
const require=createRequire(import.meta.url);
const {applyMatches}=require('../scripts/bulk-match-data.cjs');
const {makeCommit}=require('../scripts/bulk-match-commit.cjs');
const {renderLibrary}=require('../scripts/export-current-library.cjs');
const now=new Date('2026-11-07T18:00:00Z');
function fixture(){return {epoch:'original-epoch',lifecycles:{'1':'original-life','99':'retired-life'},backup:{version:1,exportedAt:now.toISOString(),shows:[{id:1,name:'Existing',summary:null as string|null,status:'Running',genres:[],service:null,url:'https://www.tvmaze.com/shows/1',syncedAt:now.toISOString()}],seasons:[{id:10,showId:1,number:1,episodeOrder:1,endDate:'2025-01-01'}],episodes:[{id:11,showId:1,season:1,number:1,name:'Old',summary:null as string|null,airstamp:'2025-01-01T12:00:00Z',airdate:'2025-01-01',type:'regular'}],preferences:[{showId:1,order:7,notes:'My existing personal note'}],progress:[{episodeId:11,showId:1,watchedAt:'2025-02-01T12:00:00Z'}],sources:[{id:'source',name:'Original source',raw:'Original preserved text',importedAt:now.toISOString(),rows:[{id:'a',title:'New show',rawTitle:'New show S1',season:1,sourceCategory:'Watched',notes:'Explicit source history',state:'pending'},{id:'b',title:'Unclear special',notes:'Keep this pending',state:'pending'}]}]}};}
function entry(){return {sourceId:'source',title:'New show',rows:[{id:'a',season:1,category:'Watched',rawTitle:'New show S1'}],bundle:{show:{id:2,name:'New show',summary:null as string|null,status:'Ended',genres:[],service:null,url:'https://www.tvmaze.com/shows/2',syncedAt:now.toISOString()},seasons:[{id:20,showId:2,number:1,episodeOrder:2,endDate:'2035-01-01'}],episodes:[{id:21,showId:2,season:1,number:1,name:'Released',summary:null as string|null,airstamp:'2025-01-01T12:00:00Z',airdate:'2025-01-01',type:'regular'},{id:22,showId:2,season:1,number:2,name:'Future',summary:null as string|null,airstamp:'2035-01-01T12:00:00Z',airdate:'2035-01-01',type:'regular'}]}};}
it('appends clear matches while preserving all previous records, original source and held entries',()=>{
 const before=fixture(),copy=structuredClone(before),result=applyMatches(before,[entry()],model,now);
 expect(before).toEqual(copy);for(const table of ['shows','seasons','episodes','preferences','progress'])expect(result.library.backup[table][0]).toEqual((before.backup as any)[table][0]);
 expect(result.library.backup.sources[0].raw).toBe('Original preserved text');expect(result.library.backup.sources[0].rows[1]).toEqual(before.backup.sources[0].rows[1]);
 expect(result.library.backup.progress.map((x:any)=>x.episodeId)).toEqual([11,21]);expect(result.library.lifecycles['99']).toBe('retired-life');expect(result.library.backup.preferences[1].order).toBe(8);
});
it('refuses ambiguous scopes, missing seasons and ownership collisions without changing its input',()=>{
 const original=fixture();const missing=entry();missing.bundle.seasons=[];expect(()=>applyMatches(original,[missing],model,now)).toThrow('Missing source season');
 const alias=entry();alias.title='New show Part 2';expect(()=>applyMatches(original,[alias],model,now)).toThrow('approval');
 const unscoped=fixture();delete (unscoped.backup.sources[0].rows[0] as any).season;const unscopedEntry=entry();delete (unscopedEntry.rows[0] as any).season;expect(()=>applyMatches(unscoped,[unscopedEntry],model,now)).toThrow('Unscoped');
 const collision=entry();collision.bundle.episodes[0].id=11;expect(()=>applyMatches(original,[collision],model,now)).toThrow('Conflicting');
 expect(original.backup.shows).toHaveLength(1);expect(original.backup.sources[0].rows[0].state).toBe('pending');
});
it('does not resurrect changed source rows or overwrite a show added after review',()=>{
 const changed=fixture();changed.backup.sources[0].rows=[];expect(applyMatches(changed,[entry()],model,now).applied).toHaveLength(0);
 const existing=fixture();existing.backup.shows.push({...entry().bundle.show});const result=applyMatches(existing,[entry()],model,now);expect(result.applied).toHaveLength(0);expect(result.library.backup.progress).toEqual(existing.backup.progress);
});
it('builds one atomic commit with a stale-write precondition and round-trips UTF-8 chunks',()=>{
 const data=fixture();data.backup.shows[0].summary='🎬'.repeat(200000);
 const manifest={updateTime:'2026-11-07T18:00:00.123456Z',fields:{revision:{integerValue:'19'},epoch:{stringValue:data.epoch},chunkCount:{integerValue:'1'}}};
 const result=makeCommit('/projects/genre-watchlist/databases/(default)/documents/users/owner/sync/library',manifest,data);
 const chunks=result.writes.filter((w:any)=>w.update?.name.includes('/chunks/'));expect(chunks.length).toBeGreaterThan(1);
 expect(JSON.parse(chunks.map((w:any)=>w.update.fields.data.stringValue).join(''))).toEqual(data);
 expect(result.writes.at(-1).currentDocument).toEqual({updateTime:manifest.updateTime});expect(result.revision).toBe(20);
 const oversized=fixture();oversized.backup.shows[0].summary='x'.repeat(6000000);expect(()=>makeCommit('/projects/p',manifest,oversized)).toThrow('6 MB');
});
it('renders the folder export using app classifications and retains unmatched titles separately',()=>{
 const data=fixture();const result=renderLibrary(data,19,now,model);expect(result).toContain('## Watched');expect(result).toContain('My existing personal note');expect(result).toContain('Unclear special');expect(result).toContain('Cloud revision 19');
});
it('includes Binge sections and Not for me in the readable folder export',()=>{
 const original=fixture();
 const data={...original,backup:{...original.backup,version:2 as const,preferences:original.backup.preferences.map(p=>({...p,bingeSection:'not-for-me' as const}))}};
 const output=renderLibrary(data,20,now,{...model,...bingeModel,...titles});
 expect(output).toContain('## Binge');expect(output).toContain('### Not for me\n\n- **Existing**');expect(output).toContain('My existing personal note');expect(output).toContain('## Watched');
});
