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

test('compact cards keep tap targets clear and grow for long text and expanded Manage',async({page})=>{
 await seed(page);const card=page.getByRole('article',{name:'Funny fantasy',exact:true});
 await page.setViewportSize({width:1280,height:1000});expect((await card.boundingBox())!.height).toBeLessThan(220);
 await expect(card.locator('.card-episode-picker small')).toBeHidden();await card.getByLabel('Current episode for Funny fantasy').selectOption('caught-up');await expect(card.getByText('Marks aired regular episodes watched; keeps tracking future episodes.',{exact:true})).toBeVisible();
 await card.getByLabel('Current episode for Funny fantasy').selectOption('');
 for(const width of [320,412,1024,1280]){
  await page.setViewportSize({width,height:1000});
  await card.getByLabel('Manage Funny fantasy',{exact:true}).click();await expect(card.getByRole('button',{name:'Not for me',exact:true})).toBeVisible();
  const controls=await card.locator('button,select,summary').evaluateAll(nodes=>nodes.filter(node=>node.checkVisibility()).map(node=>{const b=node.getBoundingClientRect();return {name:node.getAttribute('aria-label')??node.textContent,x:b.x,y:b.y,width:b.width,height:b.height};}));
  for(const control of controls)expect(control.height,control.name??'control').toBeGreaterThanOrEqual(44);
  for(let i=0;i<controls.length;i++)for(let j=i+1;j<controls.length;j++){const a=controls[i],b=controls[j];expect(Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)>1&&Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)>1,a.name+' overlaps '+b.name).toBe(false);}
  await card.getByLabel('Manage Funny fantasy',{exact:true}).click();
 }
 await page.evaluate(async()=>{const path='/src/db.ts';const {db}=await import(path);await db.shows.update(1,{name:'An extremely long fantasy series title with several words that must wrap at large text sizes',genres:['Science-Fiction','Fantasy','Comedy','Adventure']});});
 await page.setViewportSize({width:320,height:1000});await page.addStyleTag({content:'.show-card .show-title{font-size:48px}.show-card .show-meta{font-size:24px}.show-card .genre-tag{font-size:20px}'});
 await expect(page.locator('.show-title').first()).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('saved primary genre controls the first badge and accent while all genres stay filterable',async({page})=>{
 await seed(page);await page.evaluate(async()=>{const path='/src/db.ts';const {db}=await import(path);await db.shows.update(1,{genres:['Fantasy','Action']});await db.preferences.update(1,{primaryGenre:'Action'});});
 const card=page.getByRole('article',{name:'Funny fantasy',exact:true});await expect(card.locator('.genre-tag').first()).toHaveText('Action');await expect(card).toHaveClass(/genre-action/);
 await page.locator('.genre-filter summary').click();await page.getByRole('checkbox',{name:'Fantasy',exact:true}).check();await page.getByRole('checkbox',{name:'Fantasy',exact:true}).press('Escape');await expect(card).toBeVisible();
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Export backup',exact:true}).click();const exported=await download;const fs=await import('node:fs/promises');const backup=JSON.parse(await fs.readFile((await exported.path())!,'utf8'));expect(backup.version).toBe(4);expect(backup.preferences.find((p:{showId:number})=>p.showId===1)).toMatchObject({primaryGenre:'Action',notes:'Keep notes 1'});
 await page.reload();await page.getByRole('button',{name:'Binge',exact:true}).click();await expect(card.locator('.genre-tag').first()).toHaveText('Action');await expect(card).toHaveClass(/genre-action/);
});

for(const phone of [false,true])test('Manage genre editor '+(phone?'phone':'PC')+' saves only the primary preference, cancels safely and persists',async({page})=>{
 await page.setViewportSize({width:phone?320:1280,height:900});await seed(page);const card=page.getByRole('article',{name:'Funny fantasy',exact:true});
 const read=()=>page.evaluate(async()=>{const p='/src/db.ts';const {db}=await import(p);return {preference:await db.preferences.get(1),progress:await db.progress.toArray(),show:await db.shows.get(1)};});const before=await read();
 await card.getByLabel('Manage Funny fantasy',{exact:true}).click();const opener=card.getByRole('button',{name:'Change primary genre',exact:true});await opener.click();const dialog=page.getByRole('dialog',{name:'Primary genre for Funny fantasy',exact:true});await expect(dialog.getByRole('radio',{name:'Fantasy',exact:true})).toBeChecked();await dialog.getByRole('radio',{name:'Comedy',exact:true}).check();expect(await read()).toEqual(before);
 await dialog.getByRole('button',{name:'Cancel',exact:true}).click();await expect(dialog).toHaveCount(0);await expect(opener).toBeFocused();expect(await read()).toEqual(before);
 await opener.click();await expect(dialog.getByRole('radio',{name:'Fantasy',exact:true})).toBeChecked();await dialog.getByRole('radio',{name:'Comedy',exact:true}).check();expect(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);await dialog.getByRole('button',{name:'Save primary genre',exact:true}).click();await expect(dialog).toHaveCount(0);
 const after=await read();expect(after).toEqual({...before,preference:{...before.preference,primaryGenre:'Comedy'}});await expect(card.locator('.genre-tag').first()).toHaveText('Comedy');await expect(card).toHaveClass(/genre-comedy/);await page.reload();await page.getByRole('button',{name:'Binge',exact:true}).click();await expect(card.locator('.genre-tag').first()).toHaveText('Comedy');
});
test('Manage genre editor refuses stale notes, reloads safely and is available on Watched',async({page})=>{
 await seed(page);await page.evaluate(async()=>{const p='/src/db.ts';const {db}=await import(p);await db.progress.put({episodeId:11,showId:1,watchedAt:'2026-01-01T12:00:00Z'});});await page.getByRole('button',{name:'Watched',exact:true}).click();const card=page.getByRole('article',{name:'Funny fantasy',exact:true});await card.getByLabel('Manage Funny fantasy',{exact:true}).click();await card.getByRole('button',{name:'Change primary genre',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Primary genre for Funny fantasy',exact:true});await dialog.getByRole('radio',{name:'Comedy',exact:true}).check();
 await page.evaluate(async()=>{const p='/src/db.ts';const {db}=await import(p);await db.preferences.update(1,{notes:'Newer phone note'});});await dialog.getByRole('button',{name:'Save primary genre',exact:true}).click();await expect(dialog.getByRole('alert')).toContainText('Saved notes changed');
 const pref=await page.evaluate(async()=>{const p='/src/db.ts';const {db}=await import(p);return await db.preferences.get(1);});expect(pref.notes).toBe('Newer phone note');expect(pref.primaryGenre).toBeUndefined();await dialog.getByRole('button',{name:'Discard choice and load latest',exact:true}).click();await expect(dialog.getByRole('radio',{name:'Fantasy',exact:true})).toBeChecked();await dialog.getByRole('radio',{name:'Comedy',exact:true}).check();await dialog.getByRole('button',{name:'Save primary genre',exact:true}).click();await expect(dialog).toHaveCount(0);const after=await page.evaluate(async()=>{const p='/src/db.ts';const {db}=await import(p);return {preference:await db.preferences.get(1),progress:await db.progress.toArray()};});expect(after.preference).toEqual({...pref,primaryGenre:'Comedy'});expect(after.progress).toEqual([{episodeId:11,showId:1,watchedAt:'2026-01-01T12:00:00Z'}]);
});
