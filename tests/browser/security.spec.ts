import { test, expect, request as requestFactory } from '@playwright/test';
test('API validates input, blocks CSRF and isolates private files', async () => {
  const a = await requestFactory.newContext({
    baseURL: 'http://localhost:3000',
  });
  const b = await requestFactory.newContext({
    baseURL: 'http://localhost:3000',
  });
  expect((await a.get('/api/admin')).status()).toBe(403);
  expect(
    (
      await a.put('/api/workspace', {
        data: {},
        headers: { Origin: 'https://untrusted.example' },
      })
    ).status(),
  ).toBe(403);
  const first = await a.get('/api/workspace');
  expect(first.ok()).toBeTruthy();
  const { state } = await first.json();
  await b.get('/api/workspace');
  expect(
    (
      await a.put('/api/workspace', {
        data: { ...state, profile: { ...state.profile, marks: 110 } },
        headers: { Origin: 'http://localhost:3000' },
      })
    ).status(),
  ).toBe(400);
  const doc = await a.post('/api/documents', {
    data: {
      text: 'I developed a small programming project during my studies. I want to study computer science because I enjoy solving practical problems.',
    },
    headers: { Origin: 'http://localhost:3000' },
  });
  expect(doc.ok()).toBeTruthy();
  const { id } = await doc.json();
  expect((await a.get('/api/documents/' + id)).status()).toBe(200);
  expect((await b.get('/api/documents/' + id)).status()).toBe(404);
  expect(
    (
      await b.delete('/api/documents', {
        data: { id },
        headers: { Origin: 'http://localhost:3000' },
      })
    ).status(),
  ).toBe(404);
  expect(
    (
      await a.delete('/api/documents', {
        data: { id },
        headers: { Origin: 'http://localhost:3000' },
      })
    ).ok(),
  ).toBeTruthy();
  expect((await a.get('/api/documents/' + id)).status()).toBe(404);
  const chat = await a.post('/api/consultant', {
    data: { message: 'What documents do I need for a Korean D-2 visa?' },
    headers: { Origin: 'http://localhost:3000' },
  });
  expect(chat.ok()).toBeTruthy();
  expect((await chat.json()).state.messages.at(-1).text).toContain(
    'do not currently have a verified',
  );
  await a.dispose();
  await b.dispose();
});
test('profile editing and private document review are usable', async ({
  page,
}) => {
  await page.goto('/profile');
  await expect(page.locator('[data-ready=true]')).toBeVisible();
  await page
    .getByRole('spinbutton', { name: 'IELTS overall', exact: true })
    .fill('7');
  await page.getByRole('button', { name: 'Save my profile' }).click();
  await expect(page.getByRole('status')).toContainText('Changes saved');
  await page.reload();
  await expect(
    page.getByRole('spinbutton', { name: 'IELTS overall', exact: true }),
  ).toHaveValue('7');
  await page.goto('/documents');
  await expect(page.locator('[data-ready=true]')).toBeVisible();
  await page
    .getByRole('textbox', { name: 'Document text' })
    .fill(
      'I built a small software project in school because I wanted to help classmates organize their assignments. My goal is to study computer science and learn how to build dependable systems.',
    );
  await page.getByRole('button', { name: 'Review my document' }).click();
  await expect(page.locator('.document-result')).toContainText(
    'RULE-BASED WRITING CHECK',
  );
  await page
    .getByRole('button', { name: 'Delete document', exact: true })
    .click();
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: 'Delete document', exact: true })
    .click();
  await expect(page.getByText('No document reviews saved yet.')).toBeVisible();
});
