import {test,expect} from '@playwright/test';
import {filedTitle} from '../../src/titles';

test('Nightfall cards and phone navigation remain usable at narrow and compact sizes',async({page})=>{
  const name='A very long fantasy show title that must remain readable on a small phone';
  const show={id:890001,name,summary:'<p>Fictional visual test.</p>',status:'Running',genres:['Fantasy'],webChannel:{name:'Fixture service'},url:'https://www.tvmaze.com/shows/890001'};
  await page.route('**/master-working.json',route=>route.fulfill({json:{id:'nightfall-empty',name:'Fixture',raw:'',importedAt:'2026-11-07',rows:[]}}));
  await page.route('https://api.tvmaze.com/**',route=>{
    const path=new URL(route.request().url()).pathname;
    return route.fulfill({json:path==='/search/shows'?[{show}]:path.endsWith('/episodes')?[{id:891001,season:1,number:1,name:'A long episode title for the phone layout',type:'regular',airstamp:'2025-01-01T12:00:00Z',airdate:'2025-01-01'}]:path.endsWith('/seasons')?[{id:892001,number:1,episodeOrder:null,endDate:null}]:show});
  });
  await page.goto('/');
  await page.getByRole('button',{name:'Add Show',exact:true}).click();
  await page.getByLabel('Show title').fill(name);
  await page.getByRole('button',{name:'Search TVmaze'}).click();
  await page.getByRole('button',{name:`Import ${name} (#890001)`}).click();
  await page.getByRole('button',{name:'Skip for now'}).click();
  await page.getByLabel('Manage '+filedTitle(name),{exact:true}).click();await page.getByRole('button',{name:'Move to Watch soon',exact:true}).click();
  const card=page.getByRole('article',{name:filedTitle(name),exact:true});
  for(const width of [320,412,640,960,1280]){
    await page.setViewportSize({width,height:900});
    await expect(card).toBeVisible();
    await expect(page.getByLabel('Search library')).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    const arrow=await card.getByRole('button',{name:`Move ${filedTitle(name)} up`}).boundingBox();
    const other=await card.getByRole('button',{name:`Move ${filedTitle(name)} down`}).boundingBox();
    const bounds=await card.boundingBox();
    expect(arrow!.width).toBeGreaterThanOrEqual(44);
    expect(arrow!.height).toBeGreaterThanOrEqual(44);
    expect(arrow!.x).toBeGreaterThan(bounds!.x+bounds!.width-85);
    expect(Math.abs((arrow!.y+other!.y+other!.height)/2-(bounds!.y+bounds!.height/2))).toBeLessThan(4);
    if(width<840){
      const nav=await page.getByRole('navigation',{name:'Views'}).boundingBox();
      expect(nav!.y+nav!.height).toBe(900);
      await expect(page.getByRole('button',{name:'Import',exact:true})).toBeVisible();
    }
    if(width===412||width===1280)await page.screenshot({path:`artifacts/nightfall-${width}.png`,fullPage:true});
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  expect(await card.getByRole('button',{name:filedTitle(name),exact:true}).evaluate(e=>getComputedStyle(e).transitionDuration)).toBe('0s');
  await card.getByRole('button',{name:filedTitle(name),exact:true}).focus();
  await expect(card.getByRole('button',{name:filedTitle(name),exact:true})).toBeFocused();
});
