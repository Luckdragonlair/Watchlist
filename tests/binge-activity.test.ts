import {expect,it} from 'vitest';
import {bingePlacement,lastBingeActivity} from '../src/binge-model';
import {validateBackup} from '../src/backup-validation';
import type {Episode,Preference} from '../src/model';
const now=new Date('2026-11-08T18:00:00Z');
const episodes:Episode[]=[1,2,3].map(number=>({id:number,showId:1,season:1,number,name:'Episode',summary:null,type:'regular',airstamp:'2025-01-01T12:00:00Z',airdate:'2025-01-01'}));
const preference:Preference={showId:1,order:1,notes:'Keep',bingeSection:'everything-else'};
it('promotes started ready shows above untouched queues without mutating preferences or inventing history',()=>{
 expect(bingePlacement(episodes,[],[],preference,now)).toBe('Everything else');
 expect(bingePlacement(episodes,[],[{episodeId:1,watchedAt:'2026-01-01T12:00:00Z'}],preference,now)).toBe('Watching now');expect(preference.bingeSection).toBe('everything-else');
 expect(bingePlacement(episodes,[],[{episodeId:1,watchedAt:'2026-01-01T12:00:00Z'}],{...preference,bingeSection:'not-for-me'},now)).toBe('Not for me');
});
it('uses the latest recorded regular episode, respects undo, ignores special/orphan history and compares actual timestamps',()=>{
 const first={episodeId:1,watchedAt:'2026-11-08T12:00:00-06:00'},second={episodeId:2,watchedAt:'2026-11-08T17:00:00Z'};
 expect(lastBingeActivity(episodes,[first,second,{episodeId:99,watchedAt:'2030-01-01T00:00:00Z'}])).toBe(Date.parse(first.watchedAt));
 expect(lastBingeActivity(episodes,[second])).toBe(Date.parse(second.watchedAt));expect(lastBingeActivity(episodes,[])).toBe(null);
 expect(lastBingeActivity([{...episodes[0],type:'special'}],[first])).toBe(null);
});
it('keeps active Weekly and upcoming-only shows in their existing release groups',()=>{
 const progress=[{episodeId:1,watchedAt:'2026-01-01T00:00:00Z'}],later=[episodes[0],{...episodes[1],airstamp:'2026-11-13T12:00:00Z',airdate:'2026-11-13'}];
 expect(bingePlacement(later,[],progress,preference,now)).toBe(null);
 expect(bingePlacement([episodes[0],{...episodes[1],airstamp:null,airdate:'2026-11-13'}],[],progress,preference,now)).toBe('Upcoming');
});
it('preserves manual flags only in format 3; legacy formats remain readable and cannot silently carry new flags',()=>{
 const empty={exportedAt:now.toISOString(),shows:[{id:1,name:'Fixture',summary:null,status:'Running',genres:[],service:null,url:'https://www.tvmaze.com/shows/1',syncedAt:now.toISOString()}],seasons:[],episodes:[],progress:[],preferences:[{...preference,bingeManualOrder:true}],sources:[]};
 expect(validateBackup({...empty,version:3}).preferences[0].bingeManualOrder).toBe(true);
 for(const version of [1,2])expect(()=>validateBackup({...empty,version,preferences:[{showId:1,order:1,notes:'',bingeManualOrder:true}]})).toThrow('manual-order mode');
 expect(()=>validateBackup({...empty,version:3,preferences:[{...preference,bingeManualOrder:'yes'}]})).toThrow('manual-order mode');
 for(const version of [1,2])expect(validateBackup({...empty,version,preferences:[]} as never).version).toBe(version);
});
