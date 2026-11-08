import {expect,it} from 'vitest';
import {weeklyDays} from '../src/weekly-days';
it('rotates from today in Central time, wraps and keeps each day once',()=>{
 const days=weeklyDays(new Date('2026-11-06T18:00:00Z'));
 expect(days).toEqual(['Friday','Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday']);expect(new Set(days).size).toBe(7);
});
it('uses Central midnight rather than UTC midnight in standard and daylight time',()=>{
 expect(weeklyDays(new Date('2026-11-09T05:59:59Z'))[0]).toBe('Sunday');
 expect(weeklyDays(new Date('2026-11-09T06:00:00Z'))[0]).toBe('Monday');
 expect(weeklyDays(new Date('2026-07-02T04:59:59Z'))[0]).toBe('Wednesday');
 expect(weeklyDays(new Date('2026-07-02T05:00:00Z'))[0]).toBe('Thursday');
});
