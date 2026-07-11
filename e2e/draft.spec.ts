import { test, expect } from './fixtures';
import { TEST_MATCH_ID, TEST_MATCH_LOCKED_ID, TEST_PLAYERS } from './testData';

test('user can draft a trio, tag an MVP, and submit for an open match', async ({ page, signInAsUser }) => {
  await signInAsUser();
  await page.goto(`/matches/${TEST_MATCH_ID}`);

  await page.getByText(TEST_PLAYERS[0].name).click();
  await page.getByText(TEST_PLAYERS[1].name).click();
  await page.getByText(TEST_PLAYERS[2].name).click();

  await expect(page.getByText('3/3', { exact: true })).toBeVisible();

  await page.getByLabel(`Set ${TEST_PLAYERS[0].name} as MVP`).click();

  await page.getByRole('button', { name: /lock trio/i }).click();

  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await expect(page.getByText('Trios')).toBeVisible();
});

test('a locked match disables player selection', async ({ page, signInAsUser }) => {
  await signInAsUser();
  await page.goto(`/matches/${TEST_MATCH_LOCKED_ID}`);

  await expect(page.getByText('no further changes are permitted')).toBeVisible();
  const firstPlayerButton = page.getByRole('button', { name: new RegExp(TEST_PLAYERS[0].name, 'i') }).first();
  await expect(firstPlayerButton).toBeDisabled();
});
