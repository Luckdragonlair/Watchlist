import {test,expect} from '@playwright/test';

test('browser Back returns through Watchlist screens and safely cancels a delete dialog',async({page})=>{
 await page.setViewportSize({width:412,height:900});
 await page.route('**/splash/startup.js',route=>route.fulfill({contentType:'text/javascript',body:"document.querySelector('.wl-splash')?.remove();"}));
 await page.route('**/master-working.json',route=>route.fulfill({json:{id:'empty',name:'Empty',raw:'',importedAt:'2026-01-01T00:00:00Z',rows:[]}}));
 await page.goto('/');await expect(page.getByRole('heading',{name:'Weekly',exact:true})).toBeVisible();
 await page.evaluate(async()=>{const path='/src/db.ts';const {saveBundle}=await import(path);await saveBundle({show:{id:1,name:'Navigation fixture',genres:[],summary:null,status:'Running',service:'Fixture',url:'https://www.tvmaze.com/shows/1',syncedAt:new Date().toISOString()},seasons:[{id:1,showId:1,number:1,episodeOrder:2,endDate:null}],episodes:[{id:11,showId:1,season:1,number:1,name:'Episode 1',summary:null,type:'regular',airstamp:'2025-01-01T12:00:00Z',airdate:'2025-01-01'}]});});
 await page.getByRole('button',{name:'Binge',exact:true}).click();await expect(page.getByRole('heading',{name:'Binge',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Watched',exact:true}).click();await expect(page.getByRole('heading',{name:'Watched',exact:true})).toBeVisible();
 await page.goBack();await expect(page.getByRole('heading',{name:'Binge',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Navigation fixture',exact:true}).click();await expect(page.getByRole('heading',{name:'Navigation fixture',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Delete show',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Delete Navigation fixture?'});await expect(dialog).toBeVisible();
 await page.goBack();await expect(dialog).toHaveCount(0);await expect(page.getByRole('heading',{name:'Navigation fixture',exact:true})).toBeVisible();
 await page.goBack();await expect(page.getByRole('heading',{name:'Binge',exact:true})).toBeVisible();await expect(page.getByRole('article',{name:'Navigation fixture'})).toBeVisible();
 await page.goBack();await expect(page.getByRole('heading',{name:'Weekly',exact:true})).toBeVisible();
});
