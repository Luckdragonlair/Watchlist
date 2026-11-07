import {defineConfig} from 'vitest/config';
export default defineConfig({test:{include:['tests/**/*.integration.ts'],setupFiles:['fake-indexeddb/auto'],testTimeout:30000,hookTimeout:30000,fileParallelism:false}});
