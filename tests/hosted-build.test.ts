import { afterEach,describe,expect,it } from 'vitest';
import { mkdtemp,writeFile,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
// @ts-expect-error standalone build tool has no TypeScript declaration
import { checkHostedBuild } from '../scripts/check-hosted-build.mjs';
const directories:string[]=[];
async function fixture(){const dir=await mkdtemp(join(tmpdir(),'watchlist-hosted-'));directories.push(dir);await writeFile(join(dir,'hosted-build.json'),JSON.stringify({mode:'hosted'}));await writeFile(join(dir,'index.html'),'<html></html>');await writeFile(join(dir,'service-worker.js'),'const assets=[];');return dir;}
afterEach(async()=>{await Promise.all(directories.splice(0).map(dir=>rm(dir,{recursive:true,force:true})));});
describe('hosted privacy deployment guard',()=>{
  it('accepts the hosted shell',async()=>{await expect(checkHostedBuild(await fixture())).resolves.toBeUndefined();});
  it('rejects the personal catalog even if a marker exists',async()=>{const dir=await fixture();await writeFile(join(dir,'master-working.json'),'private');await expect(checkHostedBuild(dir)).rejects.toThrow('Personal');});
  it('rejects cached personal catalogs',async()=>{const dir=await fixture();await writeFile(join(dir,'service-worker.js'),'master-working.json');await expect(checkHostedBuild(dir)).rejects.toThrow('precached');});
  it('rejects ordinary local builds',async()=>{const dir=await fixture();await writeFile(join(dir,'hosted-build.json'),'{"mode":"local"}');await expect(checkHostedBuild(dir)).rejects.toThrow('hosted build');});
  it('rejects unexpected public files',async()=>{const dir=await fixture();await writeFile(join(dir,'private-notes.txt'),'private');await expect(checkHostedBuild(dir)).rejects.toThrow('Unexpected');});
});
