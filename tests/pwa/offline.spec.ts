import { chromium, expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { mkdtemp,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename,join,resolve,sep } from 'node:path';
import { productionServer } from './server';
const show={id:880001,name:'Offline fixture',premiered:'2025-01-01',language:'English',summary:null,status:'Ended',genres:[],network:null,webChannel:null,url:'https://www.tvmaze.com/shows/880001'};
const episodes=[1,2].map(number=>({id:881000+number,season:1,number,name:`Episode ${number}`,summary:null,airstamp:'2025-01-01T12:00:00Z',airdate:'2025-01-01',type:'regular'}));
async function ready(page:Page){await expect(page.getByRole('region',{name:'App availability'}).getByRole('status')).toContainText('Available offline');await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);}
async function addFixture(page:Page){
  await page.route('https://api.tvmaze.com/**',async route=>{const path=new URL(route.request().url()).pathname;await route.fulfill({json:path==='/search/shows'?[{show}]:path.endsWith('/episodes')?episodes:path.endsWith('/seasons')?[{id:882001,number:1,episodeOrder:2,endDate:'2025-01-01'}]:show});});
  await page.getByRole('button',{name:'Add Show',exact:true}).click();await page.getByLabel('Show title').fill('Offline fixture');await page.getByRole('button',{name:'Search TVmaze'}).click();await page.getByRole('button',{name:'Import Offline fixture (#880001)'}).click();await page.getByRole('button',{name:'Skip for now'}).click();await page.getByRole('button',{name:'Offline fixture',exact:true}).click();
  await page.getByLabel('Personal notes').fill('Keep offline notes');await page.getByRole('button',{name:'Save notes'}).click();await page.getByRole('button',{name:'Back to library'}).click();await page.getByLabel('Search library').fill('Offline fixture');
  await page.getByRole('checkbox',{name:'Watch Offline fixture S1 E1 · Episode 1'}).click();await expect(page.getByRole('checkbox',{name:'Watch Offline fixture S1 E2 · Episode 2'})).toBeVisible();
}
test('active offline routing leaves reserved Firebase auth pages on the network',async({page,context})=>{
  const server=await productionServer();try{
    await page.goto(server.url);await ready(page);
    // Test iframe navigation as well as top-level redirect navigation, after
    // the service worker controls the page rather than only on first load.
    await page.evaluate(()=>{const frame=document.createElement('iframe');frame.src='/__/auth/iframe';document.body.append(frame);});
    await expect(page.frameLocator('iframe').getByRole('heading',{name:'Authentication helper fixture'})).toBeVisible();
    const redirect=await context.newPage();
    const response=await redirect.goto(server.url+'/__/auth/handler');
    expect(response?.fromServiceWorker()).toBe(false);
    await expect(redirect.getByRole('heading',{name:'Authentication helper fixture'})).toBeVisible();
    await redirect.close();
    const cached=await page.evaluate(async()=>{for(const name of await caches.keys())for(const request of await(await caches.open(name)).keys())if(new URL(request.url).pathname.startsWith('/__/'))return true;return false;});
    expect(cached).toBe(false);
  }finally{await server.stop();}
});
test('production app reopens with its server stopped and supports progress, details, backup and restore offline',async({page,context})=>{
  const server=await productionServer();try{
    await page.goto(server.url);await ready(page);
    const manifest=await (await page.request.get(`${server.url}/manifest.webmanifest`)).json();expect(manifest.display).toBe('standalone');expect(manifest.start_url).toBe('./');expect(manifest.icons.map((i:{sizes:string})=>i.sizes)).toContain('192x192');expect(manifest.icons.map((i:{sizes:string})=>i.sizes)).toContain('512x512');
    for(const icon of manifest.icons){const bytes=await (await page.request.get(`${server.url}/${icon.src}`)).body();expect(`${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`).toBe(icon.sizes);}
    await addFixture(page);
    const saved=page.waitForEvent('download');await page.getByRole('region',{name:'Backup export'}).getByRole('button',{name:'Export backup',exact:true}).click();const download=await saved;const backup=JSON.parse(readFileSync((await download.path())!,'utf8'));
    await server.stop();await expect(fetch(server.url)).rejects.toThrow();await context.setOffline(true);await page.reload();
    await expect(page.getByRole('region',{name:'App availability'}).getByRole('status')).toContainText('Offline');await expect(page.getByRole('checkbox',{name:'Watch Offline fixture S1 E2 · Episode 2'})).toBeVisible();
    await page.getByRole('button',{name:'Offline fixture',exact:true}).click();await expect(page.getByLabel('Personal notes')).toHaveValue('Keep offline notes');await page.getByRole('button',{name:'Back to library'}).click();
    await page.getByRole('checkbox',{name:'Watch Offline fixture S1 E2 · Episode 2'}).click();await page.getByRole('button',{name:'Dismiss completion'}).click();await page.getByRole('button',{name:'Watched',exact:true}).click();await expect(page.getByRole('article',{name:'Offline fixture',exact:true})).toContainText('Watched seasons: 1');
    const offlineDownload=page.waitForEvent('download');await page.getByRole('region',{name:'Backup export'}).getByRole('button',{name:'Export backup',exact:true}).click();const current=await offlineDownload;expect(JSON.parse(readFileSync((await current.path())!,'utf8')).progress).toHaveLength(2);
    await page.getByLabel('Backup file').setInputFiles({name:'offline.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});const dialog=page.getByRole('dialog',{name:'Restore this backup?'});await dialog.getByRole('checkbox',{name:'Replace my current library with this backup.'}).check();await dialog.getByRole('button',{name:'Replace library and restore'}).click();await expect(dialog).not.toBeVisible();await expect(page.getByRole('checkbox',{name:'Watch Offline fixture S1 E2 · Episode 2'})).toBeVisible();
    const urls=await page.evaluate(async()=>{const names=(await caches.keys()).filter(name=>name.startsWith('watchlist-v01-static:'));return(await Promise.all(names.map(async name=>(await(await caches.open(name)).keys()).map(request=>request.url)))).flat();});expect(urls.length).toBeGreaterThan(5);expect(urls.every(url=>new URL(url).origin===server.url)).toBe(true);
    await page.close();const reopened=await context.newPage();await reopened.goto(server.url);await expect(reopened.getByRole('checkbox',{name:'Watch Offline fixture S1 E2 · Episode 2'})).toBeVisible();await reopened.close();
  }finally{await server.stop();}
});
test('an update waits for explicit acceptance and preserves the library when activated',async({page})=>{
  const server=await productionServer();try{
    await page.goto(server.url);await ready(page);await addFixture(page);
    await page.evaluate(async()=>{await(await caches.open('unrelated-app-cache')).put('/unrelated.txt',new Response('keep'));});
    server.overrides.set('/index.html',(await server.read('index.html')).replace('</head>','<meta name="pwa-build-test" content="second"></head>'));
    server.overrides.set('/service-worker.js',(await server.read('service-worker.js')).replace(/const version = "[^"]+";/,'const version = "update-test";'));
    await page.evaluate(async()=>{await(await navigator.serviceWorker.getRegistration())!.update();});await expect(page.getByRole('button',{name:'Update and reload'})).toBeVisible();
    await page.reload();await expect(page.getByRole('button',{name:'Update and reload'})).toBeVisible();await expect(page.locator('meta[name="pwa-build-test"]')).toHaveCount(0);
    await page.getByRole('button',{name:'Update and reload'}).click();await expect(page.locator('meta[name="pwa-build-test"]')).toHaveAttribute('content','second');await expect(page.getByRole('checkbox',{name:'Watch Offline fixture S1 E2 · Episode 2'})).toBeVisible();
    expect(await page.evaluate(()=>caches.has('unrelated-app-cache'))).toBe(true);expect((await page.evaluate(()=>caches.keys())).filter(name=>name.startsWith('watchlist-v01-static:'))).toHaveLength(1);
  }finally{await server.stop();}
});
test('a failed update keeps the working offline version and leaves dynamic requests uncached',async({page,context})=>{
  const server=await productionServer();try{
    await page.goto(server.url);await ready(page);await addFixture(page);
    expect(await page.evaluate(async()=>await(await fetch('/dynamic')).text())).toBe('uncached dynamic response');expect(await page.evaluate(async()=>await(await fetch('/index.html',{method:'POST'})).text())).toBe('non-GET reached server');
    const before=await page.evaluate(()=>caches.keys());
    server.overrides.set('/service-worker.js',(await server.read('service-worker.js')).replace(/const version = "[^"]+";/,'const version = "failed-update-test";').replace(/const assets = (\[[^;]+\]);/,'const assets = [...$1, "missing-required-asset.js"];'));
    await page.evaluate(async()=>{const reg=(await navigator.serviceWorker.getRegistration())!;await reg.update();if(reg.installing){const worker=reg.installing;await new Promise<void>(resolve=>worker.addEventListener('statechange',()=>{if(worker.state==='redundant')resolve();}));}});
    expect(await page.evaluate(()=>caches.keys())).toEqual(before);
    expect(await page.evaluate(async()=>{for(const name of await caches.keys()){if(await(await caches.open(name)).match('/dynamic'))return true;}return false;})).toBe(false);
    await server.stop();await context.setOffline(true);await page.reload();await expect(page.getByRole('checkbox',{name:'Watch Offline fixture S1 E2 · Episode 2'})).toBeVisible();
  }finally{await server.stop();}
});
test('offline shell and viewing history survive a full browser restart with the server stopped',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'watchlist-pwa-')),server=await productionServer();
  let context=await chromium.launchPersistentContext(directory,{channel:'msedge',headless:true});
  try{
    const page=await context.newPage();await page.goto(server.url);await ready(page);await addFixture(page);await context.close();await server.stop();
    context=await chromium.launchPersistentContext(directory,{channel:'msedge',headless:true});await context.setOffline(true);const reopened=await context.newPage();await reopened.goto(server.url);
    await expect(reopened.getByRole('checkbox',{name:'Watch Offline fixture S1 E2 · Episode 2'})).toBeVisible();await reopened.getByRole('button',{name:'Offline fixture',exact:true}).click();await expect(reopened.getByLabel('Personal notes')).toHaveValue('Keep offline notes');
  }finally{
    await context.close();await server.stop();
    const target=resolve(directory),parent=resolve(tmpdir());if(!target.startsWith(parent+sep)||!basename(target).startsWith('watchlist-pwa-'))throw new Error('Unexpected test profile path; not deleting.');
    await rm(target,{recursive:true,force:true,maxRetries:3,retryDelay:500});
  }
});
