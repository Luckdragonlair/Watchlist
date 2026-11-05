import { chromium, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext();
const page=await context.newPage();
const results={checkedAt:new Date().toISOString(),show:'Severance',showId:44933,isolatedBrowser:true,changesUserLibrary:false,siloRequested:false};
try {
  await page.goto(process.env.WATCHLIST_URL ?? 'http://127.0.0.1:5174/');
  await page.getByRole('button',{name:'Add Show',exact:true}).click();
  await page.getByLabel('Show title').fill('Severance');
  await page.getByRole('button',{name:'Search TVmaze'}).click();
  await page.getByRole('button',{name:'Import Severance (#44933)',exact:true}).click({timeout:30000});
  await expect(page.getByRole('heading',{name:'Severance',exact:true})).toBeVisible({timeout:60000});
  await expect(page.getByRole('button',{name:'Back to library'})).toBeVisible({timeout:60000});
  await expect(page.getByRole('checkbox').first()).toBeVisible();
  results.episodeCount=await page.getByRole('checkbox').count();
  await page.getByRole('button',{name:'Back to library'}).click();
  const card=page.getByRole('article',{name:'Severance',exact:true});
  const checkbox=card.getByRole('checkbox');
  results.before=await checkbox.getAttribute('aria-label');
  await checkbox.click();
  await expect(checkbox).not.toHaveAttribute('aria-label',results.before);
  results.after=await checkbox.getAttribute('aria-label');
  await page.reload();
  await expect(page.getByRole('article',{name:'Severance',exact:true}).getByRole('checkbox')).toHaveAttribute('aria-label',results.after);
  results.progressSurvivedReload=true;
  await page.screenshot({path:'artifacts/watchlist-live-import.png',fullPage:false});
  results.outcome='PASS';
} catch(error) { results.outcome='FAIL';results.error=String(error);process.exitCode=1; }
finally { await context.close();await browser.close();await writeFile('Notes/LIVE_APP_SMOKE.json',JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results,null,2)); }
