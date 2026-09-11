import type { Page } from '@playwright/test';
import { demoProfile } from '../../lib/matching';
// Existing feature tests explicitly create their test profile; production never auto-seeds it.
export async function seedProfile(page: Page, baseURL: string) {
  const response = await page.request.get('/api/workspace');
  const { state } = await response.json();
  const saved = await page.request.put('/api/workspace', {
    data: { ...state, profile: demoProfile },
    headers: { Origin: baseURL },
  });
  if (!saved.ok()) throw new Error('Could not initialize the test profile');
}
