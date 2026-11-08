import {appIconAssets} from './app-icon-assets.mjs';
import { readdir,readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { nightfallFonts } from './nightfall-assets.mjs';
import { splashAssets } from './splash-assets.mjs';
export async function checkHostedBuild(root=fileURLToPath(new URL('../dist-hosted/',import.meta.url))){
  const marker=JSON.parse(await readFile(resolve(root,'hosted-build.json'),'utf8'));
  if(marker.mode!=='hosted')throw new Error('Only a hosted build can be deployed.');
  const rootFiles=new Set(['hosted-build.json','index.html','service-worker.js','manifest.webmanifest']);
  const icons=new Set(appIconAssets);
  async function scan(dir,relative=''){for(const item of await readdir(dir,{withFileTypes:true})){
    if(item.isSymbolicLink())throw new Error('Hosted assets must not be symbolic links.');
    if(/master-working|Project Watchlist Master|\.env|backup.*\.json/i.test(item.name))throw new Error('Personal files found in hosted assets.');
    if(item.isDirectory()){
      if(relative||!['assets','icons','fonts','splash'].includes(item.name))throw new Error('Unexpected directory in hosted assets.');
      await scan(resolve(dir,item.name),item.name);
    }else if(!(relative==='assets'?/^[A-Za-z0-9_-]+\.(js|css)$/.test(item.name):relative==='icons'?icons.has(item.name):relative==='fonts'?nightfallFonts.includes(item.name):relative==='splash'?splashAssets.includes(item.name):rootFiles.has(item.name)))throw new Error('Unexpected file in hosted assets.');
  }}
  await scan(root);
  for(const name of appIconAssets)await readFile(resolve(root,'icons',name));
  const worker=await readFile(resolve(root,'service-worker.js'),'utf8');
  if(worker.includes('master-working.json'))throw new Error('The private master must not be precached.');
  await readFile(resolve(root,'index.html'));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  try{await checkHostedBuild();console.log('Hosted asset privacy check passed.');}
  catch(error){console.error(error.message);process.exitCode=1;}
}
