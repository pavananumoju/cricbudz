import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'fs';
import {
  TOKENS_FILE,
  TEST_MATCH_VISIBILITY_ID,
  TEST_MATCH_PAST_ID,
  TEST_MATCH_LOCKED_ID,
  TEST_USER_SCORE,
  TEST_USER_2_SCORE,
  TEST_PLAYERS,
} from './testData';

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

// These three cover the gap the architecture audit found: the toggle is
// only supposed to hide one specific day's not-yet-toss trios, but a naive
// Firestore rules implementation made it silently blank the leaderboard and
// every Squad Room for the whole day instead. See rules-tests/ for the
// underlying Firestore-rules-level proof; these confirm the real UI is
// unaffected end-to-end.

test('leaderboard shows current standings while the visibility toggle is ON for today', async ({ browser }) => {
  const { userToken2, adminToken } = JSON.parse(readFileSync(TOKENS_FILE, 'utf-8'));

  const adminPage = await (await browser.newContext()).newPage();
  const user2Page = await (await browser.newContext()).newPage();
  await signIn(adminPage, adminToken);
  await signIn(user2Page, userToken2);

  await setVisibilityToggle(adminPage, true);

  await user2Page.goto('/leaderboard');
  await expect(user2Page.getByText('E2E User', { exact: true })).toBeVisible();
  await expect(user2Page.getByText('E2E User Two')).toBeVisible();
  await expect(user2Page.getByText(String(TEST_USER_SCORE))).toBeVisible();
  await expect(user2Page.getByText(String(TEST_USER_2_SCORE))).toBeVisible();

  await setVisibilityToggle(adminPage, false);
});

test('a past match\'s Squad Room stays visible while the visibility toggle is ON for today', async ({ browser }) => {
  const { userToken2, adminToken } = JSON.parse(readFileSync(TOKENS_FILE, 'utf-8'));

  const adminPage = await (await browser.newContext()).newPage();
  const user2Page = await (await browser.newContext()).newPage();
  await signIn(adminPage, adminToken);
  await signIn(user2Page, userToken2);

  await setVisibilityToggle(adminPage, true);

  // TEST_MATCH_PAST_ID happened days ago — a different day than the
  // toggle's date — so its submitted squad should be visible regardless.
  await user2Page.goto(`/matches/${TEST_MATCH_PAST_ID}`);
  await expect(user2Page.getByText(/hidden until toss/i)).not.toBeVisible();
  await expect(user2Page.getByText('E2E User', { exact: true })).toBeVisible();

  await setVisibilityToggle(adminPage, false);
});

test('a post-toss squad for TODAY appears in Squad Room without flipping the toggle off', async ({ browser }) => {
  const { userToken, adminToken } = JSON.parse(readFileSync(TOKENS_FILE, 'utf-8'));

  const adminPage = await (await browser.newContext()).newPage();
  const user1Page = await (await browser.newContext()).newPage();
  await signIn(adminPage, adminToken);
  await signIn(user1Page, userToken);

  await setVisibilityToggle(adminPage, true);

  // TEST_MATCH_LOCKED_ID started an hour ago (today) — toss has already
  // passed for it, so user2's seeded squad should be visible even though
  // the toggle is on for this same day and never gets turned off below.
  await user1Page.goto(`/matches/${TEST_MATCH_LOCKED_ID}`);
  await expect(user1Page.getByText(/hidden until toss/i)).not.toBeVisible();
  await expect(user1Page.getByText('E2E User Two')).toBeVisible();

  await setVisibilityToggle(adminPage, false);
});
