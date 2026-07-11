import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'fs';
import { TOKENS_FILE, TEST_MATCH_VISIBILITY_ID, TEST_PLAYERS } from './testData';

// This is the exact scenario that can't be tested manually with only one
// person: does user2 actually see (or not see) user1's trio, depending on
// the admin's visibility toggle? Three separate signed-in browser contexts
// (admin, user1, user2) make it possible to verify for real.

async function signIn(page: Page, token: string) {
  await page.goto('/');
  await page.waitForFunction(() => typeof (window as unknown as Record<string, unknown>).__testSignInWithCustomToken === 'function');
  await page.evaluate(
    (t) => (window as unknown as { __testSignInWithCustomToken: (token: string) => Promise<unknown> }).__testSignInWithCustomToken(t),
    token
  );
  await page.waitForURL('**/dashboard', { timeout: 15000 });
}

async function setVisibilityToggle(adminPage: Page, enabled: boolean) {
  await adminPage.goto('/admin');
  const toggleButton = adminPage.getByRole('button', { name: /hide trios until toss/i });
  const dateInput = adminPage.getByLabel(/applies to/i);
  await expect(dateInput).toBeVisible();

  const today = new Date().toISOString().slice(0, 10);
  await dateInput.fill(today);

  // The toggle's current on/off state isn't independently queryable from
  // outside, so read the settings doc's effect via the page after saving:
  // click until the desired state text renders, then save.
  const trackLocator = toggleButton.locator('span > span');
  const isOn = await trackLocator.evaluate((el) => el.className.includes('translate-x-5'));
  if (isOn !== enabled) {
    await toggleButton.click();
  }
  await adminPage.getByRole('button', { name: /save visibility settings/i }).click();
  await expect(adminPage.getByText(/visibility settings saved/i)).toBeVisible({ timeout: 10000 });
}

test('visibility toggle hides trios pre-toss, and turning it off reveals them', async ({ browser }) => {
  const { userToken, userToken2, adminToken } = JSON.parse(readFileSync(TOKENS_FILE, 'utf-8'));

  const adminPage = await (await browser.newContext()).newPage();
  const user1Page = await (await browser.newContext()).newPage();
  const user2Page = await (await browser.newContext()).newPage();

  await signIn(adminPage, adminToken);
  await signIn(user1Page, userToken);
  await signIn(user2Page, userToken2);

  await setVisibilityToggle(adminPage, true);

  // user1 drafts and submits a trio for the open test match.
  await user1Page.goto(`/matches/${TEST_MATCH_VISIBILITY_ID}`);
  await user1Page.getByText(TEST_PLAYERS[0].name).click();
  await user1Page.getByText(TEST_PLAYERS[1].name).click();
  await user1Page.getByText(TEST_PLAYERS[2].name).click();
  await user1Page.getByLabel(`Set ${TEST_PLAYERS[0].name} as MVP`).click();
  await user1Page.getByRole('button', { name: /lock trio/i }).click();
  await user1Page.waitForURL('**/dashboard', { timeout: 10000 });

  // user2 should NOT see user1's trio while the toggle is on.
  await user2Page.goto(`/matches/${TEST_MATCH_VISIBILITY_ID}`);
  await expect(user2Page.getByText(/hidden until toss/i)).toBeVisible();
  await expect(user2Page.getByText('E2E User', { exact: false })).not.toBeVisible();

  // Admin turns the toggle off.
  await setVisibilityToggle(adminPage, false);

  // user2 reloads and should now see user1's submitted trio.
  await user2Page.reload();
  await expect(user2Page.getByText(/hidden until toss/i)).not.toBeVisible();
  await expect(user2Page.getByText('E2E User')).toBeVisible();
  await expect(user2Page.getByText(TEST_PLAYERS[0].name.split(' ').pop()!, { exact: false }).first()).toBeVisible();
});
