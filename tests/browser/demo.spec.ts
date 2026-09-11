import { seedProfile } from './profile-fixture';
import { test, expect } from '@playwright/test';
test('demo acceptance: analyze, save, compare, apply and reload', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: /Big ambitions/ }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Try the demo' }).click();
  await page.getByRole('button', { name: 'Analyze My Future' }).click();
  await expect(
    page.getByText('Budget calculated', { exact: true }),
  ).toBeVisible();
  await page.goto('/universities/kaist');
  await expect(
    page.getByRole('button', { name: 'Save university', exact: true }),
  ).toBeEnabled();
  await page
    .getByRole('button', { name: 'Save university', exact: true })
    .click();
  await expect(page.getByRole('status')).toContainText('Changes saved');
  await page.getByRole('button', { name: 'Create application' }).click();
  await expect(page.getByRole('status')).toContainText('Changes saved');
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Remove from shortlist' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'KAIST Admissions', exact: false })
    .last()
    .click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.goto('/universities');
  for (const card of [
    page.locator('.university').nth(0),
    page.locator('.university').nth(1),
  ]) {
    await expect(
      card.getByRole('button', { name: 'Compare', exact: true }),
    ).toBeEnabled();
    await card.getByRole('button', { name: 'Compare', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('Changes saved');
  }
  await page.goto('/compare');
  await expect(page.getByRole('table')).toBeVisible();
  await page.goto('/applications');
  await expect(
    page.getByRole('heading', { name: 'KAIST', exact: true }),
  ).toBeVisible();
  await page.goto('/simulator');
  await expect(page.locator('[data-ready=true]')).toBeVisible();
  await page.getByRole('spinbutton', { name: 'ielts', exact: true }).fill('7');
  await expect(
    page.getByRole('heading', { name: 'Before → after' }),
  ).toBeVisible();
  await page.goto('/visa');
  await expect(page.locator('[data-ready=true]')).toBeVisible();
  await page.getByRole('checkbox').first().check();
  await expect(page.getByRole('heading', { name: /14%/ })).toBeVisible();
  await page.goto('/report');
  await expect(page.locator('[data-ready=true]')).toBeVisible();
  await page.getByRole('button', { name: 'Save strategy snapshot' }).click();
  await expect(page.getByRole('status')).toContainText('Changes saved');
  await page.goto('/consultant');
  await expect(page.locator('[data-ready=true]')).toBeVisible();
  await page
    .getByRole('textbox', { name: 'Message your consultant' })
    .fill('Can you guarantee my visa?');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.locator('.message.assistant')).toContainText(
    'cannot guarantee',
  );
  await page.goto('/admin');
  await expect(
    page.getByRole('heading', { name: 'Administrator access required' }),
  ).toBeVisible();
  expect(errors).toEqual([]);
  await page.goto('/demo');
  await page.screenshot({
    path: 'artifacts/dashboard-desktop.png',
    fullPage: true,
  });
});
test('mobile layout and navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/demo');
  await expect(
    page.getByRole('heading', { name: /Good afternoon/ }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await expect(page.locator('[data-ready=true]')).toBeVisible();
  await page.getByRole('button', { name: 'Toggle Sidebar' }).click();
  await expect(page.getByRole('link', { name: /AI consultant/ })).toBeVisible();
  await page.screenshot({ path: 'artifacts/mobile-navigation.png' });
});

test.beforeEach(async ({ page, baseURL }) => {
  await seedProfile(page, baseURL!);
});
