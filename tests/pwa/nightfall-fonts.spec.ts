import {test,expect} from '@playwright/test';
import {productionServer} from './server';

test('approved Nightfall typography survives an offline reload without external font services',async({page,context})=>{
  const server=await productionServer();
  try{
    await page.goto(server.url);
    await expect(page.getByRole('region',{name:'App availability'}).getByRole('status')).toContainText('Available offline');
    await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
    const cached=await page.evaluate(async()=>{
      const keys=await caches.keys(); const urls=[];
      for(const key of keys){const cache=await caches.open(key);urls.push(...(await cache.keys()).map(r=>new URL(r.url).pathname));}
      return urls.filter(p=>p.endsWith('.woff2'));
    });
    expect(new Set(cached).size).toBe(8);
    await context.setOffline(true);
    await page.reload();
    expect(await page.evaluate(async()=>{
      await Promise.all(['Instrument Serif','IBM Plex Sans','IBM Plex Mono'].map(f=>document.fonts.load(`16px "${f}"`)));
      return ['Instrument Serif','IBM Plex Sans','IBM Plex Mono'].every(f=>document.fonts.check(`16px "${f}"`));
    })).toBe(true);
  }finally{await context.setOffline(false);await server.stop();}
});
