import { defineConfig } from '@playwright/test';
export default defineConfig({testDir:'./tests/hosted',workers:1,use:{baseURL:'http://127.0.0.1:5183',headless:true,channel:'msedge'},webServer:{command:'node node_modules/vite/bin/vite.js preview --outDir dist-hosted --host 127.0.0.1 --port 5183 --strictPort',url:'http://127.0.0.1:5183',reuseExistingServer:false}});
