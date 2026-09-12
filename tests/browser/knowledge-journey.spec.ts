import { test, expect } from '@playwright/test';
import { seedProfile } from './profile-fixture';

test('live Gemini uses indexed evidence and official citations throughout the journey', async ({
  page,
  baseURL,
}) => {
  await seedProfile(page, baseURL!);
  const catalog = await (await page.request.get('/api/catalog')).json();
  expect(catalog.programs).toHaveLength(6);
  expect(
    catalog.sources.every((s: { contentHash: string }) =>
      /^[a-f0-9]{64}$/.test(s.contentHash),
    ),
  ).toBe(true);
  for (const country of ['South Korea', 'Germany', 'United Kingdom'])
    expect(
      catalog.programs.filter(
        (p: { country: string }) => p.country === country,
      ),
    ).toHaveLength(2);
  await page.goto('/countries');
  await expect(page.locator('[data-ready=true]')).toBeVisible();
  await expect(page.getByRole('main')).toContainText('Germany');
  await page.goto('/universities/southampton');
  await expect(
    page.getByRole('heading', {
      name: 'University of Southampton',
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText(/Published tuition: GBP 33,000/)).toBeVisible();
  await page
    .getByRole('button', { name: 'Save university', exact: true })
    .click();
  await expect(page.getByRole('status')).toContainText('Changes saved');
  await page.goto('/scholarships');
  await expect(
    page.getByRole('heading', {
      name: 'UNIST undergraduate tuition scholarship',
    }),
  ).toBeVisible();
  await expect(
    page
      .getByText('No award is deducted from your base budget.', {
        exact: false,
      })
      .first(),
  ).toBeVisible();
  await page.goto('/consultant');
  await expect(page.locator('[data-ready=true]')).toBeVisible();
  const response = page.waitForResponse(
    (r) =>
      r.url().endsWith('/api/consultant') && r.request().method() === 'POST',
  );
  await page
    .getByRole('textbox', { name: 'Message your consultant' })
    .fill(
      'What is the published Southampton IELTS requirement? Quote the reviewed source and cite it.',
    );
  await page.getByRole('button', { name: 'Send message' }).click();
  const r = await response;
  expect(r.status()).toBe(200);
  const answer = await r.json();
  expect(answer.mode).toBe('ai');
  expect(answer.retrievalMode).toContain('embeddings (D1');
  await expect(page.locator('.message.assistant').last()).toContainText('6.5');
  const citation = page
    .locator('.message.assistant')
    .last()
    .getByRole('link', { name: 'Official source' })
    .first();
  await expect(citation).toHaveAttribute(
    'href',
    'https://www.southampton.ac.uk/courses/computer-science-degree-bsc',
  );
  await page.goto('/saved');
  await expect(page.getByRole('main')).toContainText(
    'University of Southampton',
  );
  await page.goto('/roadmap');
  await expect(page.locator('[data-ready=true]')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Your next steps, in order.' }),
  ).toBeVisible();
  await page.getByRole('checkbox').first().check();
  await expect(page.getByRole('status')).toContainText('Changes saved');
  await page.reload();
  await expect(page.getByRole('checkbox').first()).toBeChecked();
});

test('mobile knowledge, matching and planning pages fit the screen', async ({
  page,
  baseURL,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seedProfile(page, baseURL!);
  for (const path of [
    '/profile',
    '/countries',
    '/universities',
    '/scholarships',
    '/consultant',
    '/saved',
    '/compare',
    '/simulator',
    '/roadmap',
    '/visa',
  ]) {
    await page.goto(path);
    await expect(page.locator('[data-ready=true]')).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      path,
    ).toBe(true);
  }
  await page.screenshot({
    path: 'artifacts/knowledge-mobile.png',
    fullPage: true,
  });
});
