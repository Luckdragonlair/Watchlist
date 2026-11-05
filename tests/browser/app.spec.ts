import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
const show={id:90001,name:'Fixture series',premiered:'2025-01-01',language:'English',summary:'<p>A test synopsis</p>',status:'Ended',genres:['Drama'],network:{name:'Test service'},webChannel:null,url:'https://www.tvmaze.com/shows/90001'};
const episodes=[1,2].map(number=>({id:91000+number,season:1,number,name:`Episode ${number}`,summary:null,airstamp:'2025-01-01T12:00:00Z',airdate:'2025-01-01',type:'regular'}));
test.beforeEach(async({page})=>{
  await page.route('**/master-working.json',route=>route.fulfill({json:{id:'empty-test-source',name:'Empty test catalog',raw:'',importedAt:'2026-11-05T00:00:00Z',rows:[]}}));
  await page.route('https://api.tvmaze.com/**',async route=>{
    const path=new URL(route.request().url()).pathname;
    await route.fulfill({json:path==='/search/shows'?[{show}]:path.endsWith('/episodes')?episodes:path.endsWith('/seasons')?[{id:92001,number:1,episodeOrder:2,endDate:'2025-01-01'}]:show});
  });
});
test('search, explicit import, check-off, persistence, undo, completion and offline detail',async({page,context})=>{
  await page.goto('/'); await expect(page.getByText('No matched shows here yet.',{exact:false})).toBeVisible();
  await page.getByRole('button',{name:'Add Show',exact:true}).click(); await page.getByLabel('Show title').fill('Fixture'); await page.getByRole('button',{name:'Search TVmaze'}).click();
  await expect(page.getByRole('button',{name:'Import Fixture series (#90001)'})).toBeVisible();
  await page.getByRole('button',{name:'Import Fixture series (#90001)'}).click(); await page.getByRole('button',{name:'Back to library'}).click();
  await expect(page.getByText('2 available unwatched', {exact:false})).toBeVisible();
  await page.getByRole('checkbox',{name:'Watch Fixture series S1 E1 · Episode 1'}).click();
  await expect(page.getByRole('checkbox',{name:'Watch Fixture series S1 E2 · Episode 2'})).toBeVisible();
  await page.reload(); await expect(page.getByRole('checkbox',{name:'Watch Fixture series S1 E2 · Episode 2'})).toBeVisible();
  await page.getByRole('checkbox',{name:'Watch Fixture series S1 E2 · Episode 2'}).click(); await expect(page.getByRole('dialog',{name:'Season complete'})).toBeVisible();
  await page.getByRole('button',{name:'Undo last episode change'}).click(); await expect(page.getByRole('checkbox',{name:'Watch Fixture series S1 E2 · Episode 2'})).toBeVisible();
  await page.getByRole('checkbox',{name:'Watch Fixture series S1 E2 · Episode 2'}).click(); await page.getByRole('button',{name:'Dismiss completion'}).click();
  await page.getByRole('button',{name:'Watched',exact:true}).click(); await expect(page.getByText('Watched seasons: 1')).toBeVisible();
  await context.setOffline(true); await page.getByRole('button',{name:'Fixture series',exact:true}).click(); await expect(page.getByRole('checkbox').first()).toBeChecked();
  await page.route('https://api.tvmaze.com/**',route=>route.abort('internetdisconnected'));
  await page.getByRole('button',{name:'Refresh metadata'}).click(); await expect(page.getByRole('alert')).toBeVisible(); await expect(page.getByRole('checkbox').first()).toBeChecked();
});
test('bulk working-list retains Silo exclusion and blocks ambiguous truncated entries',async({page})=>{
  await page.goto('/'); await page.getByRole('button',{name:'Import',exact:true}).click();
  await page.getByLabel('Working list file').setInputFiles({name:'working.txt',mimeType:'text/plain',buffer:Buffer.from('Silo\nSilo Season 2\nRe S3\nFixture series')});
  await expect(page.getByText('Silo · excluded',{exact:true})).toBeVisible(); await expect(page.getByText('Silo Season 2 · excluded',{exact:true})).toBeVisible();
  await expect(page.getByText('Re S3 · review',{exact:true})).toBeVisible(); await page.getByRole('button',{name:'Find match for Fixture series'}).click();
  await page.getByRole('button',{name:'Search TVmaze'}).click(); await page.getByRole('button',{name:'Import Fixture series (#90001)'}).click();
  await expect(page.getByText('Fixture series · imported',{exact:true})).toBeVisible();
});
test('real starting catalog preserves source entries and excludes every Silo entry on desktop and mobile',async({page})=>{
  const seed=JSON.parse(readFileSync(new URL('../../public/master-working.json',import.meta.url),'utf8'));
  await page.route('**/master-working.json',route=>route.fulfill({json:seed}));
  await page.goto('/'); await expect(page.getByRole('article',{name:'Unmatched 3 Body Problem',exact:true})).toBeVisible();
  await page.getByLabel('Search library').fill('Silo'); await expect(page.getByRole('article')).toHaveCount(0);
  await page.getByLabel('Search library').fill(''); await page.getByRole('button',{name:'Weekly',exact:true}).click();
  await expect(page.getByRole('article',{name:'Unmatched VisionQuest',exact:true})).toContainText('Wednesday (unverified schedule)');
  await page.getByRole('button',{name:'Watched',exact:true}).click(); await expect(page.getByRole('article',{name:'Unmatched Severance',exact:true})).toContainText('Severance S1 · Severance S2');
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.screenshot({path:'artifacts/watchlist-mobile.png',fullPage:false});
  await page.setViewportSize({width:1280,height:900}); await page.getByRole('button',{name:'Binge',exact:true}).click();
  await page.screenshot({path:'artifacts/watchlist-desktop.png',fullPage:false});
  await page.getByRole('button',{name:'Import',exact:true}).click(); await expect(page.getByText('301 installments retained')).toBeVisible();
});
test('mid-season onboarding starts at episode eight and refresh preserves progress and personal notes',async({page})=>{
  const many=[...Array.from({length:10},(_,i)=>({...episodes[0],id:93000+i,season:1,number:i+1,name:`One ${i+1}`})),...Array.from({length:10},(_,i)=>({...episodes[0],id:94000+i,season:2,number:i+1,name:`Two ${i+1}`}))];
  await page.route('https://api.tvmaze.com/shows/90001/episodes',route=>route.fulfill({json:many}));
  await page.goto('/'); await page.getByRole('button',{name:'Add Show',exact:true}).click(); await page.getByLabel('Show title').fill('Fixture'); await page.getByRole('button',{name:'Search TVmaze'}).click(); await page.getByRole('button',{name:'Import Fixture series (#90001)'}).click();
  await page.getByRole('combobox',{name:'Current episode',exact:true}).selectOption('94007'); await page.getByRole('button',{name:'Mark earlier released episodes watched'}).click();
  await expect(page.getByRole('checkbox',{name:'S2 E7 · Two 7',exact:true})).toBeChecked(); await expect(page.getByRole('checkbox',{name:'S2 E8 · Two 8',exact:true})).not.toBeChecked();
  await page.getByLabel('Personal notes').fill('Keep my progress and corrections'); await page.getByRole('button',{name:'Save notes'}).click(); await page.getByRole('button',{name:'Refresh metadata'}).click();
  await expect(page.getByRole('checkbox',{name:'S2 E7 · Two 7',exact:true})).toBeChecked(); await expect(page.getByLabel('Personal notes')).toHaveValue('Keep my progress and corrections');
  await page.getByRole('button',{name:'Back to library'}).click(); await expect(page.getByRole('checkbox',{name:'Watch Fixture series S2 E8 · Two 8'})).toBeVisible(); await expect(page.getByText('3 available unwatched',{exact:false})).toBeVisible();
});
test('seasonless watched source requires explicit confirmation of scope',async({page})=>{
  const source={id:'seasonless-test',name:'Seasonless source',raw:'original source retained',importedAt:'2026-11-05',rows:[{id:'1',title:'Fixture series',state:'pending',notes:'Ended',sourceCategory:'Watched'}]};
  await page.route('**/master-working.json',route=>route.fulfill({json:source}));
  await page.goto('/'); await page.getByRole('button',{name:'Watched',exact:true}).click(); await page.getByRole('button',{name:'Match Fixture series with TVmaze'}).click();
  await page.getByRole('button',{name:'Search TVmaze'}).click(); await page.getByRole('button',{name:'Import Fixture series (#90001)'}).click(); await expect(page.getByRole('alert')).toContainText('Confirm the scope');
  await page.getByRole('checkbox',{name:'This source marks the whole title Watched',exact:false}).check(); await page.getByRole('button',{name:'Import Fixture series (#90001)'}).click();
  await expect(page.getByText('Fixture series · imported',{exact:true})).toBeVisible(); await page.getByRole('button',{name:'Watched',exact:true}).click(); await expect(page.getByText('Watched seasons: 1')).toBeVisible();
});
test('a future later-season premiere does not move an unfinished released season out of Binge',async({page})=>{
  const backlog=[8,9,10].map(number=>({...episodes[0],id:95000+number,season:3,number,name:`Three ${number}`}));
  const future={...episodes[0],id:96001,season:4,number:1,name:'Future premiere',airstamp:'2035-07-06T12:00:00Z',airdate:'2035-07-06'};
  await page.route('https://api.tvmaze.com/shows/90001/episodes',route=>route.fulfill({json:[...backlog,future]}));
  await page.goto('/');await page.getByRole('button',{name:'Add Show',exact:true}).click();await page.getByLabel('Show title').fill('Fixture');await page.getByRole('button',{name:'Search TVmaze'}).click();await page.getByRole('button',{name:'Import Fixture series (#90001)'}).click();
  await page.getByRole('button',{name:'Back to library'}).click();
  const card=page.getByRole('article',{name:'Fixture series',exact:true});
  await expect(card.getByRole('checkbox',{name:'Watch Fixture series S3 E8 · Three 8'})).toBeVisible();
  await expect(card).toContainText('3 available unwatched');
  await page.getByRole('button',{name:'Weekly',exact:true}).click();await expect(page.getByRole('article',{name:'Fixture series',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Binge',exact:true}).click();await expect(card.getByRole('checkbox',{name:'Watch Fixture series S3 E8 · Three 8'})).toBeVisible();
  await page.reload();await expect(card.getByRole('checkbox',{name:'Watch Fixture series S3 E8 · Three 8'})).toBeVisible();
  await card.getByRole('checkbox').click();await expect(card.getByRole('checkbox',{name:'Watch Fixture series S3 E9 · Three 9'})).toBeVisible();
  await card.getByRole('checkbox').click();await expect(card.getByRole('checkbox',{name:'Watch Fixture series S3 E10 · Three 10'})).toBeVisible();
  await card.getByRole('checkbox').click();await expect(card).toContainText('Next confirmed airing');
  await page.getByRole('button',{name:'Weekly',exact:true}).click();await expect(page.getByRole('article',{name:'Fixture series',exact:true})).toHaveCount(0);
});
test('delete confirmation can be cancelled and confirmed deletion removes all records and survives reload',async({page})=>{
  const source={id:'delete-seed',name:'Delete test seed',raw:'Fixture series original',importedAt:'2026-11-05',rows:[{id:'1',title:'Fixture series',notes:'source notes',state:'pending',sourceCategory:'Binge'}]};
  await page.route('**/master-working.json',route=>route.fulfill({json:source}));
  await page.goto('/');await page.getByRole('button',{name:'Match Fixture series with TVmaze'}).click();await page.getByRole('button',{name:'Search TVmaze'}).click();await page.getByRole('button',{name:'Import Fixture series (#90001)'}).click();
  await expect(page.getByText('Fixture series · imported',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Binge',exact:true}).click();
  await page.getByRole('checkbox',{name:'Watch Fixture series S1 E1 · Episode 1'}).click();await page.getByRole('button',{name:'Fixture series',exact:true}).click();
  await page.getByLabel('Personal notes').fill('Remove personal notes too');await page.getByRole('button',{name:'Save notes'}).click();
  page.once('dialog',dialog=>dialog.dismiss());await page.getByRole('button',{name:'Delete show',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Fixture series',exact:true})).toBeVisible();await expect(page.getByRole('checkbox').first()).toBeChecked();
  page.once('dialog',async dialog=>{expect(dialog.message()).toContain('watched history');await dialog.accept();});await page.getByRole('button',{name:'Delete show',exact:true}).click();
  await expect(page.getByText('Fixture series was deleted from your library.',{exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Undo last episode change'})).toHaveCount(0);
  await page.reload();for(const name of ['Weekly','Binge','Watched']){await page.getByRole('button',{name,exact:true}).click();await expect(page.getByRole('article')).toHaveCount(0);}
  await page.getByRole('button',{name:'Import',exact:true}).click();await expect(page.getByText('0 installments retained')).toBeVisible();
  const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Export backup'}).click();const download=await downloadPromise;const backup=JSON.parse(readFileSync((await download.path())!,'utf8'));
  for(const table of ['shows','seasons','episodes','progress','preferences']) expect(backup[table]).toEqual([]);
  expect(backup.sources[0].rows).toEqual([]);expect(JSON.stringify(backup)).not.toContain('Fixture series');
  // Re-adding is an explicit fresh import with no old viewing history.
  await page.getByRole('button',{name:'Add Show',exact:true}).click();await page.getByLabel('Show title').fill('Fixture');await page.getByRole('button',{name:'Search TVmaze'}).click();await page.getByRole('button',{name:'Import Fixture series (#90001)'}).click();
  await expect(page.getByRole('checkbox').first()).not.toBeChecked();await expect(page.getByLabel('Personal notes')).toHaveValue('');
});
test('a pending source import in another tab cannot resurrect a deleted show',async({page,context})=>{
  const source={id:'race-seed',name:'Race seed',raw:'Fixture series',importedAt:'2026-11-05',rows:[{id:'1',title:'Fixture series',notes:'',state:'pending',sourceCategory:'Binge'}]};
  await page.route('**/master-working.json',route=>route.fulfill({json:source}));
  await page.goto('/');await page.getByRole('button',{name:'Add Show',exact:true}).click();await page.getByLabel('Show title').fill('Fixture');await page.getByRole('button',{name:'Search TVmaze'}).click();await page.getByRole('button',{name:'Import Fixture series (#90001)'}).click();await page.getByRole('button',{name:'Back to library'}).click();
  const other=await context.newPage();await other.route('**/master-working.json',route=>route.fulfill({json:source}));await other.goto('/');
  await page.getByRole('button',{name:'Match Fixture series with TVmaze'}).click();await page.getByRole('button',{name:'Search TVmaze'}).click();
  let release!:()=>void;const gate=new Promise<void>(resolve=>release=resolve);let fetching!:()=>void;const started=new Promise<void>(resolve=>fetching=resolve);
  await page.route('https://api.tvmaze.com/shows/90001/episodes',async route=>{fetching();await gate;await route.fulfill({json:episodes});});
  await page.getByRole('button',{name:'Import Fixture series (#90001)'}).click();await started;
  await other.getByRole('button',{name:'Fixture series',exact:true}).click();other.once('dialog',dialog=>dialog.accept());await other.getByRole('button',{name:'Delete show',exact:true}).click();await expect(other.getByText('Fixture series was deleted from your library.',{exact:true})).toBeVisible();
  release();await expect(page.getByRole('alert')).toContainText('changed or was removed');
  await page.reload();await expect(page.getByRole('article')).toHaveCount(0);await other.close();
});
