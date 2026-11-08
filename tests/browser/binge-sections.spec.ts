import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';

test('Binge sections preserve legacy order, move/reorder/hide reversibly, and separate future/unknown dates',async({page})=>{
  await page.clock.setFixedTime(new Date('2026-11-08T18:00:00Z'));
  await page.route('**/master-working.json',route=>route.fulfill({json:{id:'empty',name:'Empty',raw:'',importedAt:'2026-11-08',rows:[]}}));
  await page.route('https://api.tvmaze.com/**',route=>route.abort());
  const names=['Zebra fixture','Bear fixture','The Alpha fixture','Dated fixture','Unknown fixture'];
  const shows=names.map((name,i)=>({id:940001+i,name,summary:null,status:'Running',genres:['Fantasy'],service:'Fixture',url:`https://www.tvmaze.com/shows/${940001+i}`,syncedAt:'2026-11-08T18:00:00Z'}));
  const episodes=shows.flatMap((show,i)=>[1,2].map(number=>({id:950000+i*10+number,showId:show.id,season:1,number,name:'Episode '+number,summary:null,type:'regular',airstamp:i<3?'2025-01-01T12:00:00Z':null,airdate:i<3?'2025-01-01':i===3?'2026-11-09':null})));
  const backup={version:1,exportedAt:'2026-11-08T18:00:00Z',shows,seasons:[],episodes,progress:[{episodeId:950001,showId:940001,watchedAt:'2026-01-01T12:00:00Z'}],preferences:shows.map((s,i)=>({showId:s.id,order:i,notes:'Preserved note '+i})),sources:[]};
  await page.goto('/');await page.getByLabel('Backup file').setInputFiles({name:'legacy.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
  const preview=page.getByRole('dialog',{name:'Restore this backup?'});await preview.getByRole('checkbox',{name:'Replace my current library with this backup.'}).check();await preview.getByRole('button',{name:'Replace library and restore'}).click();
  const soon=page.getByRole('region',{name:'Watch soon',exact:true}),watching=page.getByRole('region',{name:'Watching now',exact:true});
  await expect(soon.locator('.show-title')).toHaveText(['Zebra fixture','Bear fixture','Alpha fixture, The']);
  async function move(title:string,action:string){const card=page.getByRole('article',{name:title,exact:true});await card.getByLabel('Manage '+title,{exact:true}).click();await card.getByRole('button',{name:action,exact:true}).click();}
  await move('Alpha fixture, The','Move to Everything else');await move('Bear fixture','Move to Watching now');await move('Zebra fixture','Move to Watching now');
  await expect(watching.locator('.show-title')).toHaveText(['Bear fixture','Zebra fixture']);await page.getByRole('button',{name:'Move Zebra fixture up',exact:true}).click();await expect(watching.locator('.show-title')).toHaveText(['Zebra fixture','Bear fixture']);
  await page.reload();await expect(watching.locator('.show-title')).toHaveText(['Zebra fixture','Bear fixture']);
  const alpha=page.getByRole('region',{name:'Everything else',exact:true});await expect(alpha.locator('.show-title')).toHaveText(['Alpha fixture, The']);await expect(alpha.getByRole('button',{name:/ up| down/})).toHaveCount(0);
  await move('Bear fixture','Not for me');await expect(page.getByRole('article',{name:'Bear fixture',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Not for me',exact:true}).click();await expect(page.locator('.show-title')).toHaveText(['Bear fixture']);await move('Bear fixture','Move to Watch soon');await page.getByRole('button',{name:'Ready',exact:true}).click();await expect(soon.locator('.show-title')).toHaveText(['Bear fixture']);
  await page.getByRole('button',{name:'Upcoming & TBA',exact:true}).click();await expect(page.getByRole('region',{name:'Upcoming',exact:true}).locator('.show-title')).toHaveText(['Dated fixture']);await expect(page.getByRole('region',{name:'TBA',exact:true}).locator('.show-title')).toHaveText(['Unknown fixture']);
  await page.getByRole('button',{name:'Ready',exact:true}).click();await page.setViewportSize({width:412,height:900});await page.screenshot({path:'artifacts/binge-sections-phone.png',fullPage:true});await page.setViewportSize({width:320,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Export backup',exact:true}).click();const exported=JSON.parse(readFileSync((await (await pending).path())!,'utf8'));
  expect(exported.version).toBe(2);expect(exported.progress).toEqual(backup.progress);expect(exported.preferences.map((p:{notes:string})=>p.notes)).toEqual(backup.preferences.map(p=>p.notes));expect(exported.sources).toEqual([]);
  await page.clock.setFixedTime(new Date('2026-11-10T18:00:00Z'));await page.reload();await expect(page.getByRole('button',{name:'Dated fixture',exact:true})).toBeVisible();
});

test('Import leads to an unmatched-only Match queue that keeps its filter after setup',async({page})=>{
  const show={id:960001,name:'Queue fixture',summary:null,status:'Running',genres:[],network:null,webChannel:null,url:'https://www.tvmaze.com/shows/960001'};
  await page.route('**/master-working.json',route=>route.fulfill({json:{id:'empty',name:'Empty',raw:'',importedAt:'2026-11-08',rows:[]}}));
  await page.route('https://api.tvmaze.com/**',route=>{const path=new URL(route.request().url()).pathname;return route.fulfill({json:path==='/search/shows'?[{show}]:path.endsWith('/episodes')?[]:path.endsWith('/seasons')?[]:show});});
  await page.goto('/');await page.getByRole('button',{name:'Import',exact:true}).click();
  await page.getByLabel('Working list file').setInputFiles({name:'queue.txt',mimeType:'text/plain',buffer:Buffer.from('Queue fixture\nQueue fixture\nOther fixture\nSilo')});
  await expect(page.getByRole('button',{name:/Find match for/})).toHaveCount(0);await page.getByRole('button',{name:'Review unmatched shows'}).click();
  await page.getByLabel('Filter source entries').fill('Queue');await expect(page.getByRole('button',{name:'Find match for Queue fixture',exact:true})).toHaveCount(2);
  await page.getByRole('button',{name:'Find match for Queue fixture',exact:true}).first().click();await page.getByRole('button',{name:'Search TVmaze'}).click();await page.getByRole('button',{name:'Import Queue fixture (#960001)'}).click();
  const dialog=page.getByRole('dialog');await dialog.getByLabel('Personal notes (optional)').fill('Keep this note');await dialog.getByRole('button',{name:'Save and continue'}).click();
  await expect(page.getByRole('heading',{name:'Match',exact:true})).toBeFocused();await expect(page.getByLabel('Filter source entries')).toHaveValue('Queue');await expect(page.getByRole('button',{name:'Find match for Queue fixture',exact:true})).toHaveCount(0);
  await page.getByLabel('Filter source entries').fill('');await expect(page.getByRole('button',{name:'Find match for Other fixture'})).toBeVisible();await expect(page.getByRole('button',{name:/Find match for Silo/})).toHaveCount(0);
  await page.getByRole('button',{name:'Binge',exact:true}).click();await page.getByRole('button',{name:'Upcoming & TBA',exact:true}).click();await page.getByRole('button',{name:show.name,exact:true}).click();await expect(page.getByLabel('Personal notes')).toHaveValue('Keep this note');
});
