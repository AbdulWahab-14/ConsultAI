import { test, expect, request } from '@playwright/test';
test('fresh visitors create their own profile before analysis; other visitors stay empty', async ({
  page,
  baseURL,
}) => {
  await page.goto('/profile');
  await expect(
    page.getByRole('heading', { name: 'Create your study profile' }),
  ).toBeVisible();
  for (const name of [
    'name',
    'citizenship',
    'qualification',
    'field',
    'marks',
    'budget',
    'ielts',
  ]) {
    await expect(page.locator(`[name="${name}"]`)).toHaveValue('');
  }
  const denied = await page.request.post('/api/consultant', {
    data: { message: 'Where should I study?' },
    headers: { Origin: baseURL! },
  });
  expect(denied.status()).toBe(422);
  await page.getByLabel('Your name', { exact: true }).fill('Ayesha Test');
  await page.getByLabel('Citizenship', { exact: true }).fill('Pakistan');
  await page
    .getByLabel('Current education / qualification')
    .fill('BSc Computer Science');
  await page.getByLabel('Subject you want to study').fill('Computer Science');
  await page.getByLabel('Target degree').selectOption('Master');
  await page.getByLabel('Academic result (%)', { exact: true }).fill('91');
  await page
    .getByLabel('Available first-year funds (PKR)', { exact: true })
    .fill('5000000');
  await page.getByLabel('IELTS overall (leave blank if not taken)').fill('7');
  await page.getByRole('button', { name: 'Save profile and analyze' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.locator('[data-ready=true]')).toBeVisible();
  const saved = await (await page.request.get('/api/workspace')).json();
  expect(saved.state.profileCompleted).toBe(true);
  expect(saved.state.profile).toMatchObject({
    name: 'Ayesha Test',
    marks: 91,
    degree: 'Master',
    budget: 5000000,
    ielts: 7,
  });
  await page.reload();
  await expect(page.locator('[data-ready=true]')).toBeVisible();
  expect(
    (await (await page.request.get('/api/workspace')).json()).state.profile
      .name,
  ).toBe('Ayesha Test');
  const other = await request.newContext({ baseURL });
  try {
    const fresh = await (await other.get('/api/workspace')).json();
    expect(fresh.state.profileCompleted).toBe(false);
    expect(fresh.state.profile.name).toBe('');
    expect(fresh.state.profile.qualification).toBe('');
  } finally {
    await other.dispose();
  }
});
