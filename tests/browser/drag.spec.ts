import {test,expect,type Page} from '@playwright/test';
test.use({hasTouch:true});
async function seed(page:Page,count=3){
 await page.route('**/splash/startup.js',route=>route.fulfill({contentType:'text/javascript',body:"document.querySelector('.wl-splash')?.remove();"}));
 await page.route('**/master-working.json',route=>route.fulfill({json:{id:'drag-empty',name:'Empty',raw:'',importedAt:'2026-11-08T00:00:00Z',rows:[]}}));
 await page.goto('/');await expect(page.getByLabel('Automatic episode checks')).toBeVisible();
 await page.evaluate(async count=>{
  const modulePath='/src/db.ts';const {db,saveBundle}=await import(modulePath);
  for(let i=0;i<count;i++){const id=990001+i;await saveBundle({show:{id,name:['First pin','Hidden middle','Last pin'][i]??'Long list '+i,summary:null,status:'Running',genres:['Fantasy'],service:'Fixture',url:'https://www.tvmaze.com/shows/'+id,syncedAt:new Date().toISOString()},seasons:[{id,showId:id,number:1,episodeOrder:3,endDate:null}],episodes:[1,2,3].map(number=>({id:id*10+number,showId:id,season:1,number,name:'Episode '+number,summary:null,type:'regular',airstamp:'2025-01-01T12:00:00Z',airdate:'2025-01-01'}))});await db.preferences.update(id,{bingeSection:'watch-soon',order:i,notes:'Keep '+i});}
 },count);await page.getByRole('button',{name:'Binge',exact:true}).click();
}
async function pointerMove(page:Page,from:string,to:string,touch=false){
 const source=page.getByRole('button',{name:'Drag '+from,exact:true}),target=page.getByRole('button',{name:'Drag '+to,exact:true});await source.scrollIntoViewIfNeeded();
 const start=(await source.boundingBox())!,end=(await target.boundingBox())!,x=start.x+start.width/2,y=start.y+start.height/2,endY=end.y+end.height/2;
 const cdp=touch?await page.context().newCDPSession(page):null;
 if(cdp)await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});else{await page.mouse.move(x,y);await page.mouse.down();}
 for(let i=1;i<=12;i++){const py=y+(endY-y)*i/12;if(cdp)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:py}]});else await page.mouse.move(x,py);await page.waitForTimeout(18);}
 if(cdp){await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();}else await page.mouse.up();
}
for(const phone of [false,true])test((phone?'phone touch':'PC mouse')+' dragging, arrows and keyboard share saved order without changing notes',async({page})=>{
 await page.setViewportSize({width:phone?412:1280,height:1100});await seed(page);
 const group=page.getByRole('region',{name:'Watch soon',exact:true}),titles=group.locator('.show-title');
 await pointerMove(page,'First pin','Last pin',phone);await expect(titles).toHaveText(['Hidden middle','Last pin','First pin']);
 await group.getByRole('button',{name:'Move First pin up',exact:true}).click();await expect(titles).toHaveText(['Hidden middle','First pin','Last pin']);
 const handle=page.getByRole('button',{name:'Drag First pin',exact:true});await handle.focus();await page.keyboard.press('Space');await page.keyboard.press('Home');await page.keyboard.press('Space');
 await expect(titles).toHaveText(['First pin','Hidden middle','Last pin']);await expect(handle).toBeFocused();
 await handle.focus();await page.keyboard.press('Space');await page.keyboard.press('End');await page.keyboard.press('Escape');await expect(titles).toHaveText(['First pin','Hidden middle','Last pin']);
 await page.reload();await page.getByRole('button',{name:'Binge',exact:true}).click();await expect(titles).toHaveText(['First pin','Hidden middle','Last pin']);
 const stored=await page.evaluate(async()=>{const modulePath='/src/db.ts';const {db}=await import(modulePath);return {notes:(await db.preferences.toArray()).map((p:{notes:string})=>p.notes),watched:await db.progress.count()};});
 expect(stored).toEqual({notes:['Keep 0','Keep 1','Keep 2'],watched:0});
 expect(await handle.evaluate(e=>getComputedStyle(e).touchAction)).toBe('none');expect(await page.getByRole('article',{name:'First pin',exact:true}).evaluate(e=>getComputedStyle(e).touchAction)).toBe('auto');
 await page.screenshot({path:'artifacts/drag-'+(phone?'phone':'desktop')+'.png'});
});
test('filtered dragging retains hidden cards, and a cancelled touch drag saves nothing',async({page})=>{
 await page.setViewportSize({width:412,height:1100});await seed(page);await page.getByLabel('Search library').fill('pin');
 await pointerMove(page,'First pin','Last pin',true);await expect(page.locator('.show-title')).toHaveText(['Last pin','First pin']);await page.getByLabel('Search library').fill('');
 await expect(page.locator('.show-title')).toHaveText(['Hidden middle','Last pin','First pin']);
 const handle=page.getByRole('button',{name:'Drag Hidden middle',exact:true}),box=(await handle.boundingBox())!,cdp=await page.context().newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+20,y:box.y+20}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:box.x+20,y:box.y+120}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await cdp.detach();
 await expect(page.locator('.show-title')).toHaveText(['Hidden middle','Last pin','First pin']);await expect(page.locator('.drag-source')).toHaveCount(0);
});
test('started shows lead by recent activity, drag order persists, and recent sorting can be restored',async({page})=>{
 await page.setViewportSize({width:1280,height:1100});await seed(page);
 await page.evaluate(async()=>{const p='/src/db.ts';const {db}=await import(p);await db.progress.bulkPut([{episodeId:9900011,showId:990001,watchedAt:'2026-11-01T12:00:00Z'},{episodeId:9900031,showId:990003,watchedAt:'2026-11-07T12:00:00Z'}]);});
 const active=page.getByRole('region',{name:'Watching now',exact:true}),titles=active.locator('.show-title');
 await expect(titles).toHaveText(['Last pin','First pin']);await expect(page.getByRole('region',{name:'Watch soon',exact:true}).locator('.show-title')).toHaveText(['Hidden middle']);
 await pointerMove(page,'First pin','Last pin');await expect(titles).toHaveText(['First pin','Last pin']);
 await page.reload();await page.getByRole('button',{name:'Binge',exact:true}).click();await expect(titles).toHaveText(['First pin','Last pin']);
 await page.getByRole('button',{name:'Sort by recent activity'}).click();await expect(titles).toHaveText(['Last pin','First pin']);
 await active.getByRole('article',{name:'First pin',exact:true}).getByRole('checkbox').click();await expect(titles).toHaveText(['First pin','Last pin']);await page.getByRole('button',{name:'Undo last episode change'}).click();await expect(titles).toHaveText(['Last pin','First pin']);
 await page.setViewportSize({width:412,height:915});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'artifacts/activity-phone.png'});
});

test('phone drag auto-scrolls a long queue and cancels with Escape',async({page})=>{
 await page.setViewportSize({width:412,height:760});await seed(page,12);
 const handle=page.getByRole('button',{name:'Drag First pin',exact:true});await handle.scrollIntoViewIfNeeded();const box=(await handle.boundingBox())!,before=await page.evaluate(()=>scrollY),cdp=await page.context().newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+20,y:box.y+20}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:box.x+20,y:665}]});
 await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(before+40);
 await page.keyboard.press('Escape');await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
 await expect(page.locator('.drag-source')).toHaveCount(0);await expect(page.locator('.show-title').first()).toHaveText('First pin');
});
