import {test,expect} from '@playwright/test';

for(const mode of ['reopen','stay open'] as const)test('an ended caught-up show discovers a new season automatically ('+mode+'), preserving notes and progress',async({page})=>{
  await page.clock.install({time:new Date('2026-11-08T18:00:00Z')});
  const show={id:890001,name:'Returning series fixture',summary:null,status:'Ended',genres:['Fantasy'],network:null,webChannel:null,url:'https://www.tvmaze.com/shows/890001'};
  const first={id:891001,season:1,number:1,name:'Original finale',type:'regular',summary:null,airstamp:'2025-01-01T12:00:00Z',airdate:'2025-01-01'};
  const next={...first,id:892001,season:2,name:'Return premiere',airstamp:'2026-11-09T12:00:00Z',airdate:'2026-11-09'};
  let returning=false,reads=0;
  await page.route('**/master-working.json',route=>route.fulfill({json:{id:'empty',name:'Fixture',raw:'',importedAt:'2026-11-08',rows:[]}}));
  await page.route('https://api.tvmaze.com/**',route=>{
    const path=new URL(route.request().url()).pathname;if(path.endsWith('/episodes'))reads++;
    return route.fulfill({json:path==='/search/shows'?[{show}]:path.endsWith('/episodes')?(returning?[first,next]:[first]):path.endsWith('/seasons')?(returning?[{id:893001,number:1,episodeOrder:1,endDate:'2025-01-01'},{id:893002,number:2,episodeOrder:null,endDate:null}]:[{id:893001,number:1,episodeOrder:1,endDate:'2025-01-01'}]):{...show,status:returning?'Running':'Ended'}});
  });
  await page.goto('/');await page.getByRole('button',{name:'Add Show',exact:true}).click();await page.getByLabel('Show title').fill(show.name);
  await page.getByRole('button',{name:'Search TVmaze'}).click();await page.getByRole('button',{name:`Import ${show.name} (#890001)`}).click();
  const dialog=page.getByRole('dialog',{name:`Set up ${show.name}`});await dialog.getByLabel('Current episode (optional)').selectOption('caught-up');await dialog.getByLabel('Personal notes (optional)').fill('Keep following');await dialog.getByRole('button',{name:'Save and continue'}).click();
  await page.getByRole('button',{name:'Watched',exact:true}).click();await expect(page.getByRole('button',{name:show.name,exact:true})).toBeVisible();
  await page.reload();await expect(page.getByLabel('Automatic episode checks')).toBeVisible();expect(reads).toBe(1);
  // Finish the initial fresh-data sweep before jumping the clock a whole day.
  await page.clock.runFor(1);
  await expect.poll(()=>page.evaluate(async()=>{const modulePath='/src/db.ts';const {db}=await import(modulePath);return (await db.settings.get('metadataRefreshLease'))?.value;})).toBeUndefined();
  returning=true;await page.clock.setSystemTime(new Date('2026-11-09T18:01:00Z'));
  if(mode==='reopen')await page.reload();else await page.clock.runFor(60001);
  await expect(page.getByRole('checkbox',{name:'Watch Returning series fixture S2 E1 · Return premiere'})).toBeVisible();
  await page.getByRole('button',{name:show.name,exact:true}).click();await expect(page.getByLabel('Personal notes')).toHaveValue('Keep following');
  await expect(page.getByRole('checkbox',{name:'S1 E1 · Original finale',exact:true})).toBeChecked();await expect(page.getByRole('checkbox',{name:'S2 E1 · Return premiere',exact:true})).not.toBeChecked();
  expect(reads).toBe(2);
  await page.reload();await expect(page.getByLabel('Automatic episode checks')).toBeVisible();expect(reads).toBe(2);
});
