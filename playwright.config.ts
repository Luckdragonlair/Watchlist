import { defineConfig } from '@playwright/test';
const port=Number(process.env.WATCHLIST_TEST_PORT ?? 5180);
export default defineConfig({testDir:'./tests/browser',workers:1,use:{baseURL:`http://127.0.0.1:${port}`,headless:true,channel:'msedge'},webServer:process.env.WATCHLIST_EXTERNAL_SERVER==='1'?undefined:{command:`node node_modules/vite/bin/vite.js --host 127.0.0.1 --port ${port} --strictPort`,url:`http://127.0.0.1:${port}`,reuseExistingServer:!process.env.CI}});
