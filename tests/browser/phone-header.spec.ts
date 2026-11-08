import {test,expect} from '@playwright/test';
test('phone pages show the first episode without scrolling and keep utilities in an accessible More menu',async({page})=>{
  await page.setViewportSize({width:412,height:760});
  const shows=[{id:970001,name:'Phone binge fixture'},{id:970002,name:'Phone weekly fixture'}].map(s=>({...s,summary:null,status:'Running',genres:['Fantasy'],network:null,webChannel:{name:'Fixture'},url:`https://www.tvmaze.com/shows/${s.id}`}));
  await page.route('**/master-working.json',route=>route.fulfill({json:{id:'empty',name:'Empty',raw:'',importedAt:'2026-11-08T00:00:00Z',rows:[]}}));
  await page.route('https://api.tvmaze.com/**',route=>{
    const url=new URL(route.request().url()),show=shows.find(s=>s.id===Number(url.pathname.split('/')[2]))??shows.find(s=>s.name===url.searchParams.get('q'))!;
    const episodes=[1,2].map(number=>({id:show.id*10+number,season:1,number,name:'Episode '+number,summary:null,type:'regular',airstamp:show.id===970002&&number===2?'2035-01-05T12:00:00Z':'2025-01-01T12:00:00Z',airdate:show.id===970002&&number===2?'2035-01-05':'2025-01-01'}));
    return route.fulfill({json:url.pathname==='/search/shows'?[{show}]:url.pathname.endsWith('/episodes')?episodes:url.pathname.endsWith('/seasons')?[{id:show.id+100,number:1,episodeOrder:2,endDate:null}]:show});
  });
  await page.goto('/');
  for(const show of shows){await page.getByRole('button',{name:'Add Show',exact:true}).click();await page.getByLabel('Show title').fill(show.name);await page.getByRole('button',{name:'Search TVmaze'}).click();await page.getByRole('button',{name:`Import ${show.name} (#${show.id})`}).click();await page.getByRole('button',{name:'Skip for now'}).click();}
  const more=page.getByLabel('More Watchlist actions',{exact:true});
  for(const width of [320,412]){
    await page.setViewportSize({width,height:640});
    for(const [view,title] of [['Binge','Phone binge fixture'],['Weekly','Phone weekly fixture']]){
      await page.getByRole('button',{name:view,exact:true}).click();await page.evaluate(()=>scrollTo(0,0));
      const card=page.getByRole('article',{name:title,exact:true}),action=card.getByRole('checkbox');await expect(card).toBeVisible();
      const bounds=(await action.boundingBox())!,nav=(await page.getByRole('navigation',{name:'Views'}).boundingBox())!;
      // Reserve another 44px for the hosted account/sync row.
      expect(bounds.y+bounds.height+44).toBeLessThan(nav.y);expect((await card.boundingBox())!.y).toBeLessThan(360);
      await expect(page.getByRole('button',{name:'Export backup',exact:true})).not.toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    }
  }
  await page.getByRole('button',{name:'Binge',exact:true}).click();await more.focus();await page.keyboard.press('Enter');await expect(page.getByRole('button',{name:'Match',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Match',exact:true}).click();await expect(page.getByRole('heading',{name:'Match',exact:true})).toBeFocused();await expect(page.getByRole('button',{name:'Export backup',exact:true})).not.toBeVisible();
  await more.click();await page.keyboard.press('Escape');await expect(more).toBeFocused();await expect(page.getByRole('button',{name:'Import',exact:true})).not.toBeVisible();
  await page.getByRole('button',{name:'Binge',exact:true}).click();await more.click();const downloading=page.waitForEvent('download');await page.getByRole('button',{name:'Export backup',exact:true}).click();const download=await downloading;
  await page.getByLabel('Backup file').setInputFiles((await download.path())!);const dialog=page.getByRole('dialog',{name:'Restore this backup?'});await expect(dialog).toBeVisible();await dialog.getByRole('button',{name:'Cancel restore'}).click();await more.click();
  await page.setViewportSize({width:412,height:760});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'artifacts/compact-phone-header.png',fullPage:false});
});
