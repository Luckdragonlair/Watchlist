import { test,expect } from '@playwright/test';
test('hosted setup does not fetch the personal master or open a local library before sign-in',async({page})=>{
  const masterRequests:string[]=[];
  page.on('request',request=>{if(request.url().includes('master-working.json'))masterRequests.push(request.url());});
  // Smoke tests never contact a real identity or database service.
  await page.route('**/*',async route=>{
    if(new URL(route.request().url()).hostname!=='127.0.0.1')await route.abort();
    else await route.continue();
  });
  await page.goto('/');
  await expect(page.getByRole('button',{name:'Sign in with Google'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Restore backup',exact:true})).toHaveCount(0);
  expect(masterRequests).toEqual([]);
  // Firebase may create its own sign-in/heartbeat storage before authentication.
  expect(await page.evaluate(async()=> (await indexedDB.databases()).map(database=>database.name).filter(name=>name?.startsWith('watchlist')))).toEqual([]);
  const response=await page.request.get('/master-working.json');
  expect(response.headers()['content-type']).not.toContain('application/json');
});
