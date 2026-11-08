import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';

test('an announced episode with an empty provider date imports as unknown and stays unwatched',async({page})=>{
  const show={id:930001,name:'Unknown date fixture',summary:null,status:'Running',genres:[],network:null,webChannel:null,url:'https://www.tvmaze.com/shows/930001'};
  const episodes=[{id:931001,season:1,number:1,name:'Released',type:'regular',summary:null,airstamp:'2025-01-01T12:00:00Z',airdate:'2025-01-01'},{id:931002,season:3,number:1,name:'Announced',type:'regular',summary:null,airstamp:null,airdate:''}];
  await page.route('**/master-working.json',route=>route.fulfill({json:{id:'empty',name:'Fixture',raw:'',importedAt:'2026-11-08',rows:[]}}));
  await page.route('https://api.tvmaze.com/**',route=>{const path=new URL(route.request().url()).pathname;return route.fulfill({json:path==='/search/shows'?[{show}]:path.endsWith('/episodes')?episodes:path.endsWith('/seasons')?[]:show});});
  await page.goto('/');await page.getByRole('button',{name:'Add Show',exact:true}).click();await page.getByLabel('Show title').fill(show.name);
  await page.getByRole('button',{name:'Search TVmaze'}).click();await page.getByRole('button',{name:'Import Unknown date fixture (#930001)'}).click();
  const dialog=page.getByRole('dialog');await dialog.getByLabel('Current episode (optional)').selectOption('caught-up');await dialog.getByLabel('Personal notes (optional)').fill('Keep following');await dialog.getByRole('button',{name:'Save and continue'}).click();
  await page.getByRole('button',{name:'Upcoming & TBA',exact:true}).click();await page.getByRole('button',{name:show.name,exact:true}).click();await expect(page.getByRole('checkbox',{name:'S1 E1 · Released',exact:true})).toBeChecked();
  const future=page.getByRole('checkbox',{name:'S3 E1 · Announced',exact:true});await expect(future).not.toBeChecked();await expect(future).toBeDisabled();await expect(page.getByText('Release unknown',{exact:true})).toBeVisible();
  const downloading=page.waitForEvent('download');await page.getByRole('region',{name:'Backup export'}).getByRole('button',{name:'Export backup',exact:true}).click();
  const backup=JSON.parse(readFileSync((await (await downloading).path())!,'utf8'));
  expect(backup.episodes.find((e:{id:number})=>e.id===931002)).toMatchObject({airdate:null,airstamp:null});expect(backup.preferences[0].notes).toBe('Keep following');
});
