import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import { readCloudConfig } from './src/cloud-config';
export default defineConfig(({mode})=>{
  if(mode==='hosted'&&!readCloudConfig(loadEnv(mode,process.cwd(),'VITE_'))) throw new Error('Hosted Firebase configuration is missing. See FIREBASE.md.');
  return {publicDir:mode==='hosted'?false:'public',test:{include:['tests/**/*.test.ts'],setupFiles:['fake-indexeddb/auto']}};
});
