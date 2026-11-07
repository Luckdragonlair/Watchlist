import {test,expect,type Page} from '@playwright/test';
const show={id:860001,name:'Setup show',summary:'<p>Fictional setup fixture.</p>',status:'Running',genres:['Fantasy'],webChannel:{name:'Fixture service'},url:'https://www.tvmaze.com/shows/860001'};
const episodes=[{id:861001,season:1,number:1},{id:861002,season:1,number:2},{id:862001,season:2,number:1},{id:862002,season:2,number:2},{id:863001,season:3,number:1}].map(e=>({...e,name:`Episode ${e.season}.${e.number}`,summary:null,type:'regular',airstamp:e.season===3?'2035-01-05T12:00:00Z':'2025-01-01T12:00:00Z',airdate:e.season===3?'2035-01-05':'2025-01-01'}));
async function provider(page:Page){
  await page.route('https://api.tvmaze.com/**',route=>{const path=new URL(route.request().url()).pathname;return route.fulfill({json:path==='/search/shows'?[{show}]:path.endsWith('/episodes')?episodes:path.endsWith('/seasons')?[{id:864001,number:1,episodeOrder:2,endDate:'2025-01-01'},{id:864002,number:2,episodeOrder:2,endDate:'2025-01-01'},{id:864003,number:3,episodeOrder:null,endDate:null}]:show});});
}
async function seed(page:Page,category:'Weekly'|'Binge'|'Watched'='Binge'){
  await page.route('**/master-working.json',route=>route.fulfill({json:{id:'setup-source',name:'Working fixture',raw:'Preserved original',importedAt:'2026-11-07',rows:[{id:'1',title:show.name,rawTitle:'Setup show S1',season:1,sourceCategory:category,state:'pending',notes:'Preserved source note'},{id:'2',title:show.name,rawTitle:'Setup show S2',season:2,sourceCategory:'Binge',state:'pending',notes:''}]}}));
}
async function selectResult(page:Page){await page.getByRole('button',{name:'Search TVmaze'}).click();await page.getByRole('button',{name:'Import Setup show (#860001)'}).click();return page.getByRole('dialog',{name:'Set up Setup show',exact:true});}

test('new-show setup saves episode and notes, returns to the list and survives reload',async({page})=>{
  await provider(page);await page.route('**/master-working.json',route=>route.fulfill({json:{id:'empty',name:'Empty',raw:'',importedAt:'2026-11-07',rows:[]}}));
  await page.goto('/');await page.getByRole('button',{name:'Add Show',exact:true}).click();await page.getByLabel('Show title').fill('Setup show');
  const dialog=await selectResult(page);await expect(dialog).toBeVisible();await expect(dialog.getByRole('heading')).toBeFocused();
  await dialog.getByLabel('Current episode (optional)').selectOption('862002');await dialog.getByLabel('Personal notes (optional)').fill('Continue here after vacation');
  await page.setViewportSize({width:320,height:760});expect(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
  await page.setViewportSize({width:412,height:900});await page.screenshot({path:'artifacts/setup-phone.png',fullPage:true});
  await dialog.getByRole('button',{name:'Save and continue'}).click();await expect(dialog).toHaveCount(0);await expect(page.getByRole('heading',{name:'Binge',exact:true})).toBeFocused();
  await page.getByRole('button',{name:'Setup show',exact:true}).click();await expect(page.getByLabel('Personal notes')).toHaveValue('Continue here after vacation');
  for(const label of ['S1 E1 · Episode 1.1','S1 E2 · Episode 1.2','S2 E1 · Episode 2.1'])await expect(page.getByRole('checkbox',{name:label,exact:true})).toBeChecked();
  for(const label of ['S2 E2 · Episode 2.2','S3 E1 · Episode 3.1'])await expect(page.getByRole('checkbox',{name:label,exact:true})).not.toBeChecked();
  await page.reload();await page.getByRole('button',{name:'Setup show',exact:true}).click();await expect(page.getByLabel('Personal notes')).toHaveValue('Continue here after vacation');
});

for(const origin of ['Weekly','Binge','Watched'] as const)test(`matching from ${origin} offers setup and Skip preserves source history/notes`,async({page})=>{
  await provider(page);await seed(page,origin);await page.goto('/');await page.getByRole('button',{name:origin,exact:true}).click();
  await page.getByRole('button',{name:'Match Setup show with TVmaze'}).click();const dialog=await selectResult(page);
  await expect(dialog.getByLabel('Personal notes (optional)')).toContainText('Preserved source note');
  await dialog.getByLabel('Personal notes (optional)').fill('Discard this optional draft');await dialog.getByLabel('Current episode (optional)').selectOption('862002');
  await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(page.getByRole('heading',{name:origin,exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Binge',exact:true}).click();await page.getByRole('button',{name:'Setup show',exact:true}).click();
  await expect(page.getByLabel('Personal notes')).toContainText('Preserved source note');await expect(page.getByLabel('Personal notes')).not.toHaveValue('Discard this optional draft');
  const first=page.getByRole('checkbox',{name:'S1 E1 · Episode 1.1',exact:true});if(origin==='Watched')await expect(first).toBeChecked();else await expect(first).not.toBeChecked();
  await expect(page.getByRole('checkbox',{name:'S2 E1 · Episode 2.1',exact:true})).not.toBeChecked();
});

test('matching from Import saves optional notes and returns to the filtered queue',async({page})=>{
  await provider(page);await seed(page);await page.goto('/');await page.getByRole('button',{name:'Import',exact:true}).click();await page.getByLabel('Filter source entries').fill('Setup');
  await page.getByRole('button',{name:'Find match for Setup show S1'}).click();const dialog=await selectResult(page);
  await dialog.getByLabel('Personal notes (optional)').fill('Notes without choosing an episode');await dialog.getByRole('button',{name:'Save and continue'}).click();
  await expect(page.getByRole('heading',{name:'Import',exact:true})).toBeVisible();await expect(page.getByLabel('Filter source entries')).toHaveValue('Setup');await expect(page.getByText('Setup show S1 · imported',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Binge',exact:true}).click();await page.getByRole('button',{name:'Setup show',exact:true}).click();await expect(page.getByLabel('Personal notes')).toHaveValue('Notes without choosing an episode');await expect(page.getByRole('checkbox').first()).not.toBeChecked();
});

test('a show without episodes can still save setup notes',async({page})=>{
  await provider(page);await seed(page);await page.route('https://api.tvmaze.com/shows/860001/episodes',route=>route.fulfill({json:[]}));
  await page.goto('/');await page.getByRole('button',{name:'Add Show',exact:true}).click();await page.getByLabel('Show title').fill('Setup show');const dialog=await selectResult(page);
  await expect(dialog.getByText('No regular episodes are listed yet.',{exact:false})).toBeVisible();await dialog.getByLabel('Personal notes (optional)').fill('Waiting for premiere');await dialog.getByRole('button',{name:'Save and continue'}).click();
  await page.getByRole('button',{name:'Setup show',exact:true}).click();await expect(page.getByLabel('Personal notes')).toHaveValue('Waiting for premiere');
});
