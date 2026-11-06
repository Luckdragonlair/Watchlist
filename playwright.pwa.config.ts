import { defineConfig } from '@playwright/test';
export default defineConfig({testDir:'./tests/pwa',workers:1,timeout:60000,use:{headless:true,channel:'msedge',serviceWorkers:'allow'}});
