import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';

test('imports save filed names, alphabetized views ignore articles, and search accepts both forms',async({page})=>{
  const titles=['The Zebra','A Bear','An Otter','Theater'];
  const shows=titles.map((name,i)=>({id:910001+i,name,summary:null,status:'Ended',genres:[],network:null,webChannel:null,url:`https://www.tvmaze.com/shows/${910001+i}`}));
  await page.route('**/master-working.json',route=>route.fulfill({json:{id:'empty',name:'Fixture',raw:'',importedAt:'2026-11-08',rows:[]}}));
  await page.route('https://api.tvmaze.com/**',route=>{
    const url=new URL(route.request().url()),id=Number(url.pathname.split('/')[2]),show=shows.find(s=>s.id===id)??shows.find(s=>s.name===url.searchParams.get('q'))!;
    return route.fulfill({json:url.pathname==='/search/shows'?[{show}]:url.pathname.endsWith('/episodes')?[{id:show.id+100,season:1,number:1,name:'Finale',summary:null,type:'regular',airstamp:'2025-01-01T12:00:00Z',airdate:'2025-01-01'}]:url.pathname.endsWith('/seasons')?[{id:show.id+200,number:1,episodeOrder:1,endDate:'2025-01-01'}]:show});
  });
  await page.goto('/');await page.getByRole('button',{name:'Binge',exact:true}).click();
  for(const show of shows){
    await page.getByRole('button',{name:'Add Show',exact:true}).click();await page.getByLabel('Show title').fill(show.name);await page.getByRole('button',{name:'Search TVmaze'}).click();
    await page.getByRole('button',{name:`Import ${show.name} (#${show.id})`}).click();const dialog=page.getByRole('dialog');
    await dialog.getByLabel('Current episode (optional)').selectOption('caught-up');await dialog.getByRole('button',{name:'Save and continue'}).click();
  }
  await page.getByRole('button',{name:'Watched',exact:true}).click();
  await expect(page.locator('.show-title')).toHaveText(['An Otter','Bear, A','Theater','Zebra, The']);
  for(const query of ['The Zebra','Zebra, The']){
    await page.getByLabel('Search library').fill(query);await expect(page.locator('.show-title')).toHaveText(['Zebra, The']);
  }
  await page.getByRole('button',{name:'Zebra, The',exact:true}).click();await page.getByRole('button',{name:'Refresh metadata',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Zebra, The',exact:true})).toBeVisible();
  const downloading=page.waitForEvent('download');await page.getByRole('region',{name:'Backup export'}).getByRole('button',{name:'Export backup',exact:true}).click();
  const download=await downloading,backup=JSON.parse(readFileSync((await download.path())!,'utf8'));
  expect(backup.shows.map((s:{name:string})=>s.name)).toEqual(['Zebra, The','Bear, A','An Otter','Theater']);
  expect(backup.preferences.map((p:{order:number})=>p.order)).toEqual([0,1,2,3]);
});

// Decorative startup is covered by splash.spec; keep library/fake-clock workflows independent.
test.beforeEach(async({context})=>{await context.route('**/splash/startup.js',route=>route.fulfill({contentType:'text/javascript',body: "document.querySelector('.wl-splash')?.remove();"}));});
