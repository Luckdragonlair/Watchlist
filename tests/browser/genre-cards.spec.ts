import {test,expect,type Page} from '@playwright/test';
async function seed(page:Page){
 await page.route('**/splash/startup.js',route=>route.fulfill({contentType:'text/javascript',body:"document.querySelector('.wl-splash')?.remove();"}));
 await page.route('**/master-working.json',route=>route.fulfill({json:{id:'genre-empty',name:'Empty',raw:'',importedAt:'2026-11-08T00:00:00Z',rows:[]}}));
 await page.goto('/');await expect(page.getByLabel('Automatic episode checks')).toBeVisible();
 await page.evaluate(async()=>{const path='/src/db.ts';const {db,saveBundle}=await import(path);for(const [i,name,genres] of [[1,'Funny fantasy',['Fantasy','Comedy']],[2,'Scary fixture',['Horror']],[3,'Comedy fixture',['Comedy']]] as [number,string,string[]][]){await saveBundle({show:{id:i,name,genres,summary:null,status:'Running',service:'Fixture',url:'https://www.tvmaze.com/shows/'+i,syncedAt:new Date().toISOString()},seasons:[{id:i,showId:i,number:1,episodeOrder:3,endDate:null}],episodes:[1,2,3].map(number=>({id:i*10+number,showId:i,season:number===3?2:1,number,name:'Episode '+number,summary:null,type:'regular',airstamp:number===3?'2099-01-01T12:00:00Z':'2025-01-01T12:00:00Z',airdate:number===3?'2099-01-01':'2025-01-01'}))});await db.preferences.update(i,{bingeSection:'watch-soon',order:i,notes:'Keep notes '+i});}});
 await page.getByRole('button',{name:'Binge',exact:true}).click();
}
test('genre choices combine with search, preserve hidden order, and do not leak to Weekly',async({page})=>{
 await seed(page);await page.locator('.genre-filter summary').click();await page.getByRole('checkbox',{name:'Comedy',exact:true}).check();await expect(page.locator('.show-title')).toHaveText(['Funny fantasy','Comedy fixture']);
 await page.getByRole('checkbox',{name:'Horror',exact:true}).check();await expect(page.locator('.show-title')).toHaveCount(3);await page.getByRole('checkbox',{name:'Horror',exact:true}).uncheck();await page.getByRole('checkbox',{name:'Comedy',exact:true}).press('Escape');
 await page.getByLabel('Search library').fill('Funny');await expect(page.locator('.show-title')).toHaveText(['Funny fantasy']);await page.getByLabel('Search library').fill('');
 const handle=page.getByRole('button',{name:'Drag Funny fantasy',exact:true});await handle.focus();await page.keyboard.press('Space');await page.keyboard.press('End');await page.keyboard.press('Space');await expect(page.locator('.show-title')).toHaveText(['Comedy fixture','Funny fantasy']);
 await page.locator('.genre-filter summary').click();await page.getByRole('button',{name:'Show all genres',exact:true}).click();await expect(page.locator('.show-title')).toHaveText(['Scary fixture','Comedy fixture','Funny fantasy']);
 await page.getByRole('button',{name:'Weekly',exact:true}).click();await expect(page.locator('.genre-filter')).toHaveCount(0);
});
test('card picker requires Apply, preserves notes/history/future tracking, and layout fits phone and PC',async({page})=>{
 await seed(page);const card=page.getByRole('article',{name:'Funny fantasy',exact:true}),picker=card.getByLabel('Current episode for Funny fantasy');
 const progress=()=>page.evaluate(async()=>{const path='/src/db.ts';const {db}=await import(path);return (await db.progress.toArray()).filter((p:{showId:number})=>p.showId===1).map((p:{episodeId:number})=>p.episodeId).sort();});
 await picker.selectOption('12');expect(await progress()).toEqual([]);await card.getByRole('button',{name:'Apply',exact:true}).click();await expect.poll(progress).toEqual([11]);
 for(const width of [320,412,1024,1280]){await page.setViewportSize({width,height:1000});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);const art=(await card.locator('.show-art').boundingBox())!,drag=(await card.getByRole('button',{name:'Drag Funny fantasy',exact:true}).boundingBox())!,manage=(await card.getByLabel('Manage Funny fantasy',{exact:true}).boundingBox())!;expect(drag.y).toBeGreaterThanOrEqual(art.y+art.height);expect(manage.x).toBeGreaterThanOrEqual(drag.x-4);await expect(picker).toBeVisible();if(width===412||width===1280)await page.screenshot({path:'artifacts/genre-cards-'+width+'.png',fullPage:true});}
 await picker.selectOption('caught-up');await card.getByRole('button',{name:'Apply',exact:true}).click();await expect.poll(progress).toEqual([11,12]);
 expect(await page.evaluate(async()=>{const path='/src/db.ts';const {db}=await import(path);return (await db.preferences.get(1)).notes;})).toBe('Keep notes 1');
 await page.getByRole('button',{name:'Upcoming & TBA',exact:true}).click();await expect(card).toBeVisible();await expect(card.getByText('1 upcoming',{exact:false})).toBeVisible();
});
