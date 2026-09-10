import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/browser',
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://localhost:3000',
    channel: 'chrome',
    headless: true,
    screenshot: 'only-on-failure',
  },
  timeout: 120000,
  expect: { timeout: 15000 },
  reporter: 'list',
});
