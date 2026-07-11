import { test, expect } from './fixtures';
import { TEST_USER_SCORE, TEST_USER_2_SCORE } from './testData';

test('leaderboard shows real standings computed from scored squads', async ({ page, signInAsUser2 }) => {
  await signInAsUser2();
  await page.goto('/leaderboard');

  await expect(page.getByText('E2E User', { exact: true })).toBeVisible();
  await expect(page.getByText('E2E User Two')).toBeVisible();
  await expect(page.getByText(String(TEST_USER_SCORE))).toBeVisible();
  await expect(page.getByText(String(TEST_USER_2_SCORE))).toBeVisible();
});
