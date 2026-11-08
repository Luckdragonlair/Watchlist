import {appIconAssets} from './app-icon-assets.mjs';
import { spawnSync } from 'node:child_process';
import { cp, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { buildServiceWorker } from './build-service-worker.mjs';
import { nightfallFonts } from './nightfall-assets.mjs';
import { splashAssets } from './splash-assets.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const build=spawnSync(process.execPath,[fileURLToPath(new URL('../node_modules/vite/bin/vite.js',import.meta.url)),'build','--mode','hosted','--outDir','dist-hosted'],{cwd:root,stdio:'inherit'});
if(build.status!==0)process.exit(build.status??1);
// Deliberate allowlist: the user's personal master is never a hosted public asset.
await mkdir(new URL('../dist-hosted/icons/',import.meta.url),{recursive:true});
for(const path of ['manifest.webmanifest',...appIconAssets.map(name=>'icons/'+name)]){
  await cp(new URL(`../public/${path}`,import.meta.url),new URL(`../dist-hosted/${path}`,import.meta.url));
}
await writeFile(new URL('../dist-hosted/hosted-build.json',import.meta.url),JSON.stringify({mode:'hosted',syncEnabled:true}));
await mkdir(new URL('../dist-hosted/fonts/',import.meta.url),{recursive:true});
for(const file of nightfallFonts) await cp(new URL(`../public/fonts/${file}`,import.meta.url),new URL(`../dist-hosted/fonts/${file}`,import.meta.url));
await mkdir(new URL('../dist-hosted/splash/',import.meta.url),{recursive:true});
for(const file of splashAssets) await cp(new URL(`../public/splash/${file}`,import.meta.url),new URL(`../dist-hosted/splash/${file}`,import.meta.url));
const worker=await buildServiceWorker(fileURLToPath(new URL('../dist-hosted/',import.meta.url)));
console.log(`Hosted build prepared without the personal master; ${worker.assets} cached assets. Owner-only synchronization is included.`);
