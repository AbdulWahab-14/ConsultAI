import { chromium } from '@playwright/test';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('PAGE ERROR', e.stack));
page.on('console', (m) => {
  if (m.type() === 'error') console.log('CONSOLE', m.text());
});
page.on('response', (r) => {
  if (r.status() >= 400) console.log('HTTP', r.status(), r.url());
});
await page.goto('http://localhost:3000/demo');
await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
console.log('PAGE', await page.title());
console.log('LOADED', await page.locator('body').innerText());
await page.getByRole('button', { name: 'Analyze My Future' }).click();
console.log('AFTER CLICK', await page.locator('.scan-results').count());
await page.screenshot({ path: 'artifacts/diagnose.png', fullPage: true });
await browser.close();
