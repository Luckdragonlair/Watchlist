import {expect,it} from 'vitest';
import {bucket,queue,weeklyRelease,type Episode} from '../src/model';
const episode=(id:number,season:number,number:number,stamp:string):Episode=>({id,showId:1,season,number,name:`Episode ${number}`,summary:null,type:'regular',airstamp:stamp,airdate:stamp.slice(0,10)});
const old=episode(1,1,1,'2025-07-11T12:00:00Z');
const premiere=episode(2,2,1,'2026-10-30T12:00:00Z');
const next=episode(3,2,2,'2026-11-06T12:00:00Z');
const last=episode(4,2,3,'2026-11-13T12:00:00Z');
const episodes=[old,premiere,next,last];

it('moves an active new season to Weekly despite an unwatched older season, without changing the watch queue',()=>{
  const before=new Date('2026-10-29T12:00:00Z');
  expect(bucket(episodes,[],[],before)).toBe('Binge');
  expect(weeklyRelease(episodes,[],before)).toBeUndefined();
  const during=new Date('2026-11-07T12:00:00Z');
  expect(bucket(episodes,[],[],during)).toBe('Weekly');
  expect(weeklyRelease(episodes,[],during)).toEqual(last);
  expect(queue(episodes,[],during).next).toEqual(old);
  expect(queue(episodes,[],during).available).toEqual([old,premiere,next]);
  expect(bucket(episodes,[],[],new Date('2026-11-14T12:00:00Z'))).toBe('Binge');
});

it('requires a released regular episode in the upcoming season, not just a special',()=>{
  const special={...premiere,number:null,type:'significant_special'};
  const now=new Date('2026-11-01T12:00:00Z');
  expect(bucket([old,special,next],[],[],now)).toBe('Binge');
  expect(weeklyRelease([old,special,next],[],now)).toBeUndefined();
});
