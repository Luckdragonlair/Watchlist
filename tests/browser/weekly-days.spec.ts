import {test,expect} from '@playwright/test';
test('Weekly launches today first, skips empty days and rotates across Central midnight without reload',async({page})=>{
 await page.clock.install({time:new Date('2026-11-08T05:59:30Z')}); // Saturday 23:59 CST
 await page.route('**/splash/startup.js',route=>route.fulfill({contentType:'text/javascript',body:"document.querySelector('.wl-splash')?.remove();"}));
 await page.route('**/master-working.json',route=>route.fulfill({json:{id:'weekly-empty',name:'Empty',raw:'',importedAt:'2026-11-08T00:00:00Z',rows:[]}}));
 await page.goto('/');await expect(page.getByRole('button',{name:'Weekly',exact:true})).toHaveAttribute('aria-current','page');
 await expect(page.getByLabel('Automatic episode checks')).toBeVisible();
 await page.evaluate(async()=>{
  const modulePath='/src/db.ts';const {db}=await import(modulePath);
  for(const [id,name,stamp] of [[980001,'Saturday fixture','2026-11-15T01:00:00Z'],[980002,'Sunday fixture','2026-11-09T01:00:00Z'],[980003,'Tuesday fixture','2026-11-11T01:00:00Z']] as const){
   await db.shows.put({id,name,summary:null,status:'Running',genres:[],service:'Fixture',url:'https://www.tvmaze.com/shows/'+id,syncedAt:new Date().toISOString()});
   await db.seasons.put({id,showId:id,number:1,episodeOrder:2,endDate:null});
   await db.preferences.put({showId:id,order:id,notes:'Unchanged'});
   for(const number of [1,2])await db.episodes.put({id:id*10+number,showId:id,season:1,number,name:'Fixture '+number,summary:null,type:'regular',airstamp:number===1?'2026-11-01T12:00:00Z':stamp,airdate:number===1?'2026-11-01':stamp.slice(0,10)});
  }
 });
 const headings=page.locator('.watchlist-app>section>h2');
 await expect(headings).toHaveText(['Saturday','Sunday','Tuesday']);
 await page.clock.runFor(60001);await expect(headings).toHaveText(['Sunday','Tuesday','Saturday']);
 await page.clock.setSystemTime(new Date('2026-11-09T06:00:01Z'));await page.evaluate(()=>dispatchEvent(new Event('focus')));
 await expect(headings).toHaveText(['Tuesday','Saturday']);
});
