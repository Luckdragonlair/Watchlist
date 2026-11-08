import {test,expect} from '@playwright/test';
for(const viewport of [{width:320,height:640},{width:412,height:915},{width:915,height:412},{width:1280,height:900}]){
 test('original splash and Weekly launch at '+viewport.width+'x'+viewport.height,async({page})=>{
  await page.setViewportSize(viewport);
  await page.route('**/master-working.json',route=>route.fulfill({json:{id:'splash-fixture',name:'Empty',raw:'',importedAt:'2026-11-08T00:00:00Z',rows:[]}}));
  await page.goto('/');await expect(page.locator('.wl-splash')).toBeVisible();
  await expect(page.getByRole('button',{name:'Weekly',exact:true})).toHaveAttribute('aria-current','page');
  await page.evaluate(()=>document.fonts.ready);
  const flight=await page.evaluate(()=>document.getAnimations().filter(a=>a.effect instanceof KeyframeEffect&&a.effect.target instanceof Element&&a.effect.target.classList.contains('wl-logo__fly')).map(a=>a.effect!.getTiming()));
  expect(flight[0].delay).toBe(4450);expect(flight[0].duration).toBe(600);
  await expect(page.locator('.wl-splash')).toHaveCount(0,{timeout:9000});
  await expect(page.locator('[data-wl-banner-title]')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(viewport.width===412||viewport.width===915)await page.screenshot({path:'artifacts/splash-banner-'+viewport.width+'.png'});
  await page.getByRole('button',{name:'Binge',exact:true}).click();
  await expect(page.locator('.wl-splash')).toHaveCount(0);
  await page.reload();await expect(page.getByRole('button',{name:'Weekly',exact:true})).toHaveAttribute('aria-current','page');
 });
}
test('reduced motion and forced colours clear safely without moving focus',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
 await page.locator('body').click({position:{x:1,y:1},force:true});
 await expect(page.locator('.wl-splash')).toHaveCount(0,{timeout:4000});
 expect(await page.evaluate(()=>document.activeElement===document.body)).toBe(true);
 await page.emulateMedia({forcedColors:'active'});await page.reload();await expect(page.locator('.wl-splash')).toHaveCount(0);
 await expect(page.locator('[data-wl-banner-title]')).toBeVisible();
});
test('failed animation script cannot strand the splash',async({page})=>{
 await page.route('**/splash/splash-core.js',route=>route.abort());await page.goto('/');
 await expect(page.locator('.wl-splash')).toHaveCount(0);await expect(page.locator('[data-wl-banner-title]')).toBeVisible();
});

test('banner status keeps expanded account and sync recovery actions within narrow screens',async({page})=>{
 await page.route('**/splash/startup.js',route=>route.fulfill({contentType:'text/javascript',body:"document.querySelector('.wl-splash')?.remove();"}));
 await page.goto('/');
 for(const width of [320,412,915,1280]){
  await page.setViewportSize({width,height:760});
  await page.evaluate(()=>{document.getElementById('watchlist-banner-status')!.innerHTML='<div class="cloud-toolbar"><details class="cloud-account" open><summary>Account</summary><section><p>Fixture account details</p><button>Fixture sign out</button></section></details><section class="cloud-sync" data-phase="conflict"><p role="alert">Fixture synchronization conflict. Both saved copies are retained.</p><button>Review fixture copies</button></section></div>';});
  const action=page.getByRole('button',{name:'Review fixture copies'});await expect(action).toBeVisible();
  const box=(await action.boundingBox())!;expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(width);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});
