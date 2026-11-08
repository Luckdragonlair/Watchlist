import { expect, test, type Page } from '@playwright/test';
async function skipSetupAndOpenDetails(page:Page){await page.getByRole('dialog',{name:'Set up Fixture series',exact:true}).getByRole('button',{name:'Skip for now'}).click();await page.getByRole('button',{name:'Binge',exact:true}).click();await page.getByRole('button',{name:'Fixture series',exact:true}).click();}
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
  await page.goto('/'); await expect(page.getByRole('heading',{name:'Everything else',exact:false})).toBeVisible();
  await page.getByRole('button',{name:'Add Show',exact:true}).click(); await page.getByLabel('Show title').fill('Fixture'); await page.getByRole('button',{name:'Search TVmaze'}).click();
  await expect(page.getByRole('button',{name:'Import Fixture series (#90001)'})).toBeVisible();
  await page.getByRole('button',{name:'Import Fixture series (#90001)'}).click();await skipSetupAndOpenDetails(page); await page.getByRole('button',{name:'Back to library'}).click();
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
  await page.getByRole('button',{name:'Match',exact:true}).click(); await expect(page.getByRole('button',{name:/Find match for Silo/})).toHaveCount(0);
  await expect(page.getByText('Re S3 · review',{exact:true})).toBeVisible(); await page.getByRole('button',{name:'Find match for Fixture series'}).click();
  await page.getByRole('button',{name:'Search TVmaze'}).click(); await page.getByRole('button',{name:'Import Fixture series (#90001)'}).click();await page.getByRole('button',{name:'Skip for now'}).click();
  await expect(page.getByRole('button',{name:'Find match for Fixture series',exact:true})).toHaveCount(0);
});
test('real starting catalog is preserved in Match, with no source queue under library views',async({page})=>{
  const seed=JSON.parse(readFileSync(new URL('../../public/master-working.json',import.meta.url),'utf8'));
  await page.route('**/master-working.json',route=>route.fulfill({json:seed}));await page.goto('/');
  for(const name of ['Weekly','Binge','Watched']){await page.getByRole('button',{name,exact:true}).click();await expect(page.getByRole('button',{name:/Find match for/})).toHaveCount(0);}
  await page.getByRole('button',{name:'Match',exact:true}).click();await page.getByLabel('Filter source entries').fill('3 Body Problem');await expect(page.getByRole('button',{name:/Find match for 3 Body Problem/}).first()).toBeVisible();
  await page.getByLabel('Filter source entries').fill('Silo');await expect(page.getByRole('article')).toHaveCount(0);await page.getByLabel('Filter source entries').fill('');
  await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);await page.screenshot({path:'artifacts/watchlist-mobile.png',fullPage:false});
  await page.setViewportSize({width:1280,height:900});await page.getByRole('button',{name:'Binge',exact:true}).click();await page.screenshot({path:'artifacts/watchlist-desktop.png',fullPage:false});
  await page.getByRole('button',{name:'Import',exact:true}).click();await expect(page.getByText('301 installments retained',{exact:false})).toBeVisible();
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Export backup',exact:true}).click();const backup=JSON.parse(readFileSync((await (await pending).path())!,'utf8'));expect(backup.sources[0]).toEqual(seed);
});
test('mid-season onboarding starts at episode eight and refresh preserves progress and personal notes',async({page})=>{
  const many=[...Array.from({length:10},(_,i)=>({...episodes[0],id:93000+i,season:1,number:i+1,name:`One ${i+1}`})),...Array.from({length:10},(_,i)=>({...episodes[0],id:94000+i,season:2,number:i+1,name:`Two ${i+1}`}))];
  await page.route('https://api.tvmaze.com/shows/90001/episodes',route=>route.fulfill({json:many}));
  await page.goto('/'); await page.getByRole('button',{name:'Add Show',exact:true}).click(); await page.getByLabel('Show title').fill('Fixture'); await page.getByRole('button',{name:'Search TVmaze'}).click(); await page.getByRole('button',{name:'Import Fixture series (#90001)'}).click();await skipSetupAndOpenDetails(page);
  await page.getByRole('combobox',{name:'Current episode',exact:true}).selectOption('94007'); await page.getByRole('button',{name:'Mark earlier released episodes watched'}).click();
  await expect(page.getByRole('checkbox',{name:'S2 E7 · Two 7',exact:true})).toBeChecked(); await expect(page.getByRole('checkbox',{name:'S2 E8 · Two 8',exact:true})).not.toBeChecked();
  await page.getByLabel('Personal notes').fill('Keep my progress and corrections'); await page.getByRole('button',{name:'Save notes'}).click(); await page.getByRole('button',{name:'Refresh metadata'}).click();
  await expect(page.getByRole('checkbox',{name:'S2 E7 · Two 7',exact:true})).toBeChecked(); await expect(page.getByLabel('Personal notes')).toHaveValue('Keep my progress and corrections');
  await page.getByRole('button',{name:'Back to library'}).click(); await expect(page.getByRole('checkbox',{name:'Watch Fixture series S2 E8 · Two 8'})).toBeVisible(); await expect(page.getByText('3 available unwatched',{exact:false})).toBeVisible();
});
test('seasonless watched source requires explicit confirmation of scope',async({page})=>{
  const source={id:'seasonless-test',name:'Seasonless source',raw:'original source retained',importedAt:'2026-11-05',rows:[{id:'1',title:'Fixture series',state:'pending',notes:'Ended',sourceCategory:'Watched'}]};
  await page.route('**/master-working.json',route=>route.fulfill({json:source}));
  await page.goto('/'); await page.getByRole('button',{name:'Watched',exact:true}).click(); await page.getByRole('button',{name:'Match',exact:true}).click();await page.getByRole('button',{name:'Find match for Fixture series',exact:true}).click();
  await page.getByRole('button',{name:'Search TVmaze'}).click(); await page.getByRole('button',{name:'Import Fixture series (#90001)'}).click(); await expect(page.getByRole('alert')).toContainText('Confirm the scope');
  await page.getByRole('checkbox',{name:'This source marks the whole title Watched',exact:false}).check(); await page.getByRole('button',{name:'Import Fixture series (#90001)'}).click();await page.getByRole('button',{name:'Skip for now'}).click();await page.getByRole('button',{name:'Import',exact:true}).click();
  await expect(page.getByRole('button',{name:'Find match for Fixture series',exact:true})).toHaveCount(0); await page.getByRole('button',{name:'Watched',exact:true}).click(); await expect(page.getByText('Watched seasons: 1')).toBeVisible();
});
test('a future later-season premiere does not move an unfinished released season out of Binge',async({page})=>{
  const backlog=[8,9,10].map(number=>({...episodes[0],id:95000+number,season:3,number,name:`Three ${number}`}));
  const future={...episodes[0],id:96001,season:4,number:1,name:'Future premiere',airstamp:'2035-07-06T12:00:00Z',airdate:'2035-07-06'};
  await page.route('https://api.tvmaze.com/shows/90001/episodes',route=>route.fulfill({json:[...backlog,future]}));
  await page.goto('/');await page.getByRole('button',{name:'Add Show',exact:true}).click();await page.getByLabel('Show title').fill('Fixture');await page.getByRole('button',{name:'Search TVmaze'}).click();await page.getByRole('button',{name:'Import Fixture series (#90001)'}).click();await skipSetupAndOpenDetails(page);
  await page.getByRole('button',{name:'Back to library'}).click();
  const card=page.getByRole('article',{name:'Fixture series',exact:true});
  await expect(card.getByRole('checkbox',{name:'Watch Fixture series S3 E8 · Three 8'})).toBeVisible();
  await expect(card).toContainText('3 available unwatched');
  await page.getByRole('button',{name:'Weekly',exact:true}).click();await expect(page.getByRole('article',{name:'Fixture series',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Binge',exact:true}).click();await expect(card.getByRole('checkbox',{name:'Watch Fixture series S3 E8 · Three 8'})).toBeVisible();
  await page.reload();await expect(card.getByRole('checkbox',{name:'Watch Fixture series S3 E8 · Three 8'})).toBeVisible();
  await card.getByRole('checkbox').click();await expect(card.getByRole('checkbox',{name:'Watch Fixture series S3 E9 · Three 9'})).toBeVisible();
  await card.getByRole('checkbox').click();await expect(card.getByRole('checkbox',{name:'Watch Fixture series S3 E10 · Three 10'})).toBeVisible();
  await card.getByRole('checkbox').click();await page.getByRole('button',{name:'Upcoming & TBA',exact:true}).click();await expect(card).toContainText('Next confirmed airing');
  await page.getByRole('button',{name:'Weekly',exact:true}).click();await expect(page.getByRole('article',{name:'Fixture series',exact:true})).toHaveCount(0);
});
test('delete confirmation can be cancelled and confirmed deletion removes all records and survives reload',async({page})=>{
  const source={id:'delete-seed',name:'Delete test seed',raw:'Fixture series original',importedAt:'2026-11-05',rows:[{id:'1',title:'Fixture series',notes:'source notes',state:'pending',sourceCategory:'Binge'}]};
  await page.route('**/master-working.json',route=>route.fulfill({json:source}));
  await page.goto('/');await page.getByRole('button',{name:'Match',exact:true}).click();await page.getByRole('button',{name:'Find match for Fixture series',exact:true}).click();await page.getByRole('button',{name:'Search TVmaze'}).click();await page.getByRole('button',{name:'Import Fixture series (#90001)'}).click();await page.getByRole('button',{name:'Skip for now'}).click();await page.getByRole('button',{name:'Import',exact:true}).click();
  await expect(page.getByRole('button',{name:'Find match for Fixture series',exact:true})).toHaveCount(0);await page.getByRole('button',{name:'Binge',exact:true}).click();
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
  await page.getByRole('button',{name:'Add Show',exact:true}).click();await page.getByLabel('Show title').fill('Fixture');await page.getByRole('button',{name:'Search TVmaze'}).click();await page.getByRole('button',{name:'Import Fixture series (#90001)'}).click();await skipSetupAndOpenDetails(page);
  await expect(page.getByRole('checkbox').first()).not.toBeChecked();await expect(page.getByLabel('Personal notes')).toHaveValue('');
});
test('a pending source import in another tab cannot resurrect a deleted show',async({page,context})=>{
  const source={id:'race-seed',name:'Race seed',raw:'Fixture series',importedAt:'2026-11-05',rows:[{id:'1',title:'Fixture series',notes:'',state:'pending',sourceCategory:'Binge'}]};
  await page.route('**/master-working.json',route=>route.fulfill({json:source}));
  await page.goto('/');await page.getByRole('button',{name:'Add Show',exact:true}).click();await page.getByLabel('Show title').fill('Fixture');await page.getByRole('button',{name:'Search TVmaze'}).click();await page.getByRole('button',{name:'Import Fixture series (#90001)'}).click();await skipSetupAndOpenDetails(page);await page.getByRole('button',{name:'Back to library'}).click();
  const other=await context.newPage();await other.route('**/master-working.json',route=>route.fulfill({json:source}));await other.goto('/');
  await page.getByRole('button',{name:'Match',exact:true}).click();await page.getByRole('button',{name:'Find match for Fixture series',exact:true}).click();await page.getByRole('button',{name:'Search TVmaze'}).click();
  let release!:()=>void;const gate=new Promise<void>(resolve=>release=resolve);let fetching!:()=>void;const started=new Promise<void>(resolve=>fetching=resolve);
  await page.route('https://api.tvmaze.com/shows/90001/episodes',async route=>{fetching();await gate;await route.fulfill({json:episodes});});
  await page.getByRole('button',{name:'Import Fixture series (#90001)'}).click();await started;
  await other.getByRole('button',{name:'Fixture series',exact:true}).click();other.once('dialog',dialog=>dialog.accept());await other.getByRole('button',{name:'Delete show',exact:true}).click();await expect(other.getByText('Fixture series was deleted from your library.',{exact:true})).toBeVisible();
  release();await expect(page.getByRole('alert')).toContainText('changed or was removed');
  await page.reload();await expect(page.getByRole('article')).toHaveCount(0);await other.close();
});
test('backup export downloads viewing history and shows feedback plus a reusable download link beside the button',async({page})=>{
  await page.goto('/');await page.getByRole('button',{name:'Add Show',exact:true}).click();await page.getByLabel('Show title').fill('Fixture');await page.getByRole('button',{name:'Search TVmaze'}).click();await page.getByRole('button',{name:'Import Fixture series (#90001)'}).click();await skipSetupAndOpenDetails(page);await page.getByRole('button',{name:'Back to library'}).click();
  await page.getByRole('checkbox',{name:'Watch Fixture series S1 E1 · Episode 1'}).click();await expect(page.getByRole('checkbox',{name:'Watch Fixture series S1 E2 · Episode 2'})).toBeVisible();
  const section=page.getByRole('region',{name:'Backup export'});
  const downloading=page.waitForEvent('download');await section.getByRole('button',{name:'Export backup',exact:true}).click();const first=await downloading;
  const backup=JSON.parse(readFileSync((await first.path())!,'utf8'));expect(backup.shows[0].id).toBe(90001);expect(backup.episodes).toHaveLength(2);expect(backup.progress).toEqual([expect.objectContaining({episodeId:91001,showId:90001})]);expect(backup.sources).toHaveLength(1);
  await expect(section.getByRole('status')).toContainText('Check your Downloads folder');await expect(section.getByRole('status')).toBeInViewport();
  const link=section.getByRole('link',{name:'Download backup file again'});await expect(link).toBeVisible();expect(first.suggestedFilename()).toMatch(/^watchlist-backup-.*\.json$/);
  const downloadingAgain=page.waitForEvent('download');await link.click();const second=await downloadingAgain;
  expect(JSON.parse(readFileSync((await second.path())!,'utf8'))).toEqual(backup);
  await expect(page.getByRole('checkbox',{name:'Watch Fixture series S1 E2 · Episode 2'})).toBeVisible();
});
test('restore previews and cancels safely, then recovers an exported library with notes and watched progress',async({page})=>{
  await page.goto('/');await page.getByRole('button',{name:'Add Show',exact:true}).click();await page.getByLabel('Show title').fill('Fixture');await page.getByRole('button',{name:'Search TVmaze'}).click();await page.getByRole('button',{name:'Import Fixture series (#90001)'}).click();await skipSetupAndOpenDetails(page);
  await page.getByLabel('Personal notes').fill('Bring these notes back');await page.getByRole('button',{name:'Save notes'}).click();await page.getByRole('checkbox',{name:'S1 E1 · Episode 1',exact:true}).click();await expect(page.getByRole('checkbox',{name:'S1 E1 · Episode 1',exact:true})).toBeChecked();
  const downloading=page.waitForEvent('download');await page.getByRole('region',{name:'Backup export'}).getByRole('button',{name:'Export backup',exact:true}).click();const download=await downloading;const path=(await download.path())!;
  page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Delete show',exact:true}).click();await expect(page.getByText('Fixture series was deleted from your library.',{exact:true})).toBeVisible();
  await page.getByLabel('Backup file').setInputFiles(path);const preview=page.getByRole('dialog',{name:'Restore this backup?'});await expect(preview).toContainText('1 shows · 2 episodes · 1 watched-episode records');await expect(preview.getByRole('button',{name:'Replace library and restore'})).toBeDisabled();
  await preview.getByRole('button',{name:'Cancel restore'}).click();await expect(page.getByRole('article')).toHaveCount(0);
  await page.getByLabel('Backup file').setInputFiles(path);await expect(preview).toBeVisible();
  const safeguard=page.waitForEvent('download');await preview.getByRole('button',{name:'Export backup',exact:true}).click();const currentBackup=await safeguard;expect(JSON.parse(readFileSync((await currentBackup.path())!,'utf8')).shows).toEqual([]);
  await preview.getByRole('checkbox',{name:'Replace my current library with this backup.'}).check();await preview.getByRole('button',{name:'Replace library and restore'}).click();
  await expect(preview).not.toBeVisible();await expect(page.getByRole('region',{name:'Backup restore'}).getByRole('status')).toContainText('Backup restored');await expect(page.getByRole('checkbox',{name:'Watch Fixture series S1 E2 · Episode 2'})).toBeVisible();await expect(page.getByRole('button',{name:'Undo last episode change'})).toHaveCount(0);
  await page.reload();await expect(page.getByRole('checkbox',{name:'Watch Fixture series S1 E2 · Episode 2'})).toBeVisible();await page.getByRole('button',{name:'Fixture series',exact:true}).click();await expect(page.getByLabel('Personal notes')).toHaveValue('Bring these notes back');await expect(page.getByRole('checkbox').first()).toBeChecked();
});
test('malformed restore files leave the existing library untouched',async({page})=>{
  await page.goto('/');await page.getByRole('button',{name:'Add Show',exact:true}).click();await page.getByLabel('Show title').fill('Fixture');await page.getByRole('button',{name:'Search TVmaze'}).click();await page.getByRole('button',{name:'Import Fixture series (#90001)'}).click();await skipSetupAndOpenDetails(page);await page.getByRole('button',{name:'Back to library'}).click();
  await page.getByLabel('Backup file').setInputFiles({name:'broken.json',mimeType:'application/json',buffer:Buffer.from('{broken')});await expect(page.getByRole('region',{name:'Backup restore'}).getByRole('alert')).toContainText('could not be read');await expect(page.getByRole('dialog')).not.toBeVisible();await expect(page.getByRole('checkbox',{name:'Watch Fixture series S1 E1 · Episode 1'})).toBeVisible();
  await page.getByLabel('Backup file').setInputFiles({name:'future.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({version:99}))});await expect(page.getByRole('region',{name:'Backup restore'}).getByRole('alert')).toContainText('unsupported');await expect(page.getByRole('article',{name:'Fixture series',exact:true})).toBeVisible();
});
test('an empty restore stays empty after reload and does not reimport the starter catalog',async({page})=>{
  const source={id:'empty-restore-seed',name:'Starter',raw:'Fixture',importedAt:'2026-11-05T00:00:00Z',rows:[{id:'1',title:'Fixture series',notes:'',state:'pending',sourceCategory:'Binge'}]};
  await page.route('**/master-working.json',route=>route.fulfill({json:source}));await page.goto('/');await page.getByRole('button',{name:'Match',exact:true}).click();await expect(page.getByRole('article')).toHaveCount(1);
  const backup={version:1,exportedAt:'2026-11-05T00:00:00Z',shows:[],seasons:[],episodes:[],progress:[],preferences:[],sources:[]};
  await page.getByLabel('Backup file').setInputFiles({name:'empty.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});const dialog=page.getByRole('dialog',{name:'Restore this backup?'});await dialog.getByRole('checkbox',{name:'Replace my current library with this backup.'}).check();await dialog.getByRole('button',{name:'Replace library and restore'}).click();await expect(dialog).not.toBeVisible();await expect(page.getByRole('article')).toHaveCount(0);
  await page.reload();await expect(page.getByRole('button',{name:'Restore backup',exact:true})).toBeEnabled();await expect(page.getByRole('article')).toHaveCount(0);await page.getByRole('button',{name:'Import',exact:true}).click();await expect(page.getByRole('article')).toHaveCount(0);
});
test('restoring in another tab clears old undo state and rejects an older in-flight import',async({page,context})=>{
  await page.goto('/');await page.getByRole('button',{name:'Add Show',exact:true}).click();await page.getByLabel('Show title').fill('Fixture');await page.getByRole('button',{name:'Search TVmaze'}).click();await page.getByRole('button',{name:'Import Fixture series (#90001)'}).click();await skipSetupAndOpenDetails(page);await page.getByRole('button',{name:'Back to library'}).click();
  await page.getByRole('checkbox',{name:'Watch Fixture series S1 E1 · Episode 1'}).click();await expect(page.getByRole('button',{name:'Undo last episode change'})).toBeVisible();
  await page.getByRole('button',{name:'Add Show',exact:true}).click();await page.getByLabel('Show title').fill('Fixture');await page.getByRole('button',{name:'Search TVmaze'}).click();
  let release!:()=>void,started!:()=>void;const gate=new Promise<void>(resolve=>release=resolve),waiting=new Promise<void>(resolve=>started=resolve);
  await page.route('https://api.tvmaze.com/shows/90001/episodes',async route=>{started();await gate;await route.fulfill({json:episodes});});await page.getByRole('button',{name:'Import Fixture series (#90001)'}).click();await waiting;
  const other=await context.newPage();await other.goto('/');const backup={version:1,exportedAt:'2026-11-05T00:00:00Z',shows:[],seasons:[],episodes:[],progress:[],preferences:[],sources:[]};
  await other.getByLabel('Backup file').setInputFiles({name:'empty.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});const dialog=other.getByRole('dialog',{name:'Restore this backup?'});await dialog.getByRole('checkbox',{name:'Replace my current library with this backup.'}).check();await dialog.getByRole('button',{name:'Replace library and restore'}).click();await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('button',{name:'Undo last episode change'})).toHaveCount(0);release();await expect(page.getByRole('alert')).toContainText('library was restored');await page.reload();await expect(page.getByRole('article')).toHaveCount(0);await other.close();
});

test('remote notes refresh clean drafts and preserve conflicting unsaved drafts',async({page,context})=>{
  await page.goto('/');
  await page.getByRole('button',{name:'Add Show',exact:true}).click();
  await page.getByLabel('Show title').fill('Fixture');
  await page.getByRole('button',{name:'Search TVmaze'}).click();
  await page.getByRole('button',{name:'Import Fixture series (#90001)'}).click();await skipSetupAndOpenDetails(page);
  const other=await context.newPage();await other.goto('/');
  async function remoteNotes(value:string){await other.evaluate(async value=>{
    const modulePath='/src/db.ts';
    const {db}=await import(modulePath);
    await db.preferences.update(90001,{notes:value});
  },value);}
  await remoteNotes('Latest from phone');
  await expect(page.getByLabel('Personal notes')).toHaveValue('Latest from phone');
  await page.getByLabel('Personal notes').fill('My unsaved PC draft');
  await remoteNotes('Another phone edit');
  await expect(page.getByText('Notes changed on another device. Your draft is still here.')).toBeVisible();
  await expect(page.getByLabel('Personal notes')).toHaveValue('My unsaved PC draft');
  await expect(page.getByRole('button',{name:'Save notes',exact:true})).toBeDisabled();
  await page.getByRole('button',{name:'Discard draft and load latest notes'}).click();
  await expect(page.getByLabel('Personal notes')).toHaveValue('Another phone edit');
  await other.close();
});
