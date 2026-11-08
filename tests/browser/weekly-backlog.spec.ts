import {test,expect} from '@playwright/test';
test('an active second season appears under Friday even while season one is unwatched',async({page})=>{
  await page.clock.setFixedTime(new Date('2026-11-07T18:00:00Z'));
  const show={id:870001,name:'Weekly backlog fixture',summary:null,status:'Running',genres:['Drama'],webChannel:{name:'Test service'},url:'https://www.tvmaze.com/shows/870001'};
  const ep=(id:number,season:number,number:number,stamp:string)=>({id,season,number,name:`Season ${season} episode ${number}`,type:'regular',summary:null,airstamp:stamp,airdate:stamp.slice(0,10)});
  const episodes=[ep(871001,1,1,'2025-07-11T12:00:00Z'),ep(872001,2,1,'2026-10-30T12:00:00Z'),ep(872002,2,2,'2026-11-06T12:00:00Z'),ep(872003,2,3,'2026-11-13T12:00:00Z')];
  await page.route('**/master-working.json',route=>route.fulfill({json:{id:'weekly-empty',name:'Fixture',raw:'',importedAt:'2026-11-07',rows:[]}}));
  await page.route('https://api.tvmaze.com/**',route=>{const path=new URL(route.request().url()).pathname;return route.fulfill({json:path==='/search/shows'?[{show}]:path.endsWith('/episodes')?episodes:path.endsWith('/seasons')?[{id:873001,number:1,episodeOrder:1,endDate:'2025-07-11'},{id:873002,number:2,episodeOrder:3,endDate:'2026-11-13'}]:show});});
  await page.goto('/');await page.getByRole('button',{name:'Binge',exact:true}).click();await page.getByRole('button',{name:'Add Show',exact:true}).click();
  await page.getByLabel('Show title').fill(show.name);await page.getByRole('button',{name:'Search TVmaze'}).click();await page.getByRole('button',{name:`Import ${show.name} (#${show.id})`}).click();
  await page.getByRole('button',{name:'Skip for now'}).click();
  const card=page.getByRole('article',{name:show.name,exact:true});
  await expect(card).toHaveCount(0);
  await page.getByRole('button',{name:'Weekly',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Friday',exact:true})).toBeVisible();
  await expect(card.getByRole('checkbox',{name:'Watch Weekly backlog fixture S1 E1 · Season 1 episode 1'})).toBeVisible();
  await card.getByRole('button',{name:show.name,exact:true}).click();
  for(const label of ['S1 E1 · Season 1 episode 1','S2 E1 · Season 2 episode 1','S2 E2 · Season 2 episode 2'])await expect(page.getByRole('checkbox',{name:label,exact:true})).not.toBeChecked();
  await page.getByRole('button',{name:'Back to library'}).click();await page.reload();await page.getByRole('button',{name:'Binge',exact:true}).click();await page.getByRole('button',{name:'Weekly',exact:true}).click();
  await expect(card).toBeVisible();
});

// Decorative startup is covered by splash.spec; keep library/fake-clock workflows independent.
test.beforeEach(async({context})=>{await context.route('**/splash/startup.js',route=>route.fulfill({contentType:'text/javascript',body: "document.querySelector('.wl-splash')?.remove();"}));});
