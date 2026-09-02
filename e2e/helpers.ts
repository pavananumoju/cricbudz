import { expect, type Page } from '@playwright/test';

// Reusable multi-user actions/readers for E2E specs. See e2e/MULTIUSER.md.

const rx = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Drafts a trio on a match's draft page: picks the 3 named players, tags the
// MVP, and submits. Leaves the caller on /dashboard (the app redirects there
// on a successful lock).
export async function draftTrio(
  page: Page,
  opts: { matchId: string; playerNames: [string, string, string]; mvpName: string }
) {
  // Retry the first nav — under a burst of concurrent sessions the Next dev
  // server can abort a navigation while it compiles the route.
  for (let attempt = 0; ; attempt++) {
    try {
      await page.goto(`/matches/${opts.matchId}`, { waitUntil: 'domcontentloaded' });
      break;
    } catch (err) {
      if (attempt >= 3) throw err;
      await page.waitForTimeout(500);
    }
  }
  await expect(page.getByText('Trio Selection')).toBeVisible({ timeout: 20000 });

  for (const name of opts.playerNames) {
    // PlayerCard's accessible name is the player name, or "<name> (selected)"
    // once picked — anchored so we never hit the MVP/remove buttons in SelectedSlots.
    await page
      .getByRole('button', { name: new RegExp(`^${rx(name)}( \\(selected\\))?$`) })
      .first()
      .click();
  }
  await expect(page.getByText('3/3', { exact: true })).toBeVisible();

  await page.getByLabel(`Set ${opts.mvpName} as MVP`).click();
  await page.getByRole('button', { name: /lock trio/i }).click();
  await page.waitForURL('**/dashboard', { timeout: 15000 });
}

// The other users' trios currently visible in Squad Room on a match's draft
// page (raw display names, CSS-transform ignored). Empty if the
// hidden-until-toss / no-trios message is showing instead.
export async function readSquadRoomNames(page: Page, matchId: string): Promise<string[]> {
  await page.goto(`/matches/${matchId}`);
  await expect(page.getByRole('heading', { name: 'Squad Room' })).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(1200); // let the async Squad Room fetch resolve
  const names = await page
    .getByTestId('squadroom-user')
    .evaluateAll((els) => els.map((e) => (e.textContent || '').trim()))
    .catch(() => [] as string[]);
  return names.filter(Boolean);
}

// Reads the rendered leaderboard for the currently-selected week: one entry
// per row, in display order, with the rank + points the DOM carries.
export async function readLeaderboard(
  page: Page
): Promise<{ userId: string; name: string; rank: number; points: number }[]> {
  await expect(page.getByTestId('standings-row').first()).toBeVisible({ timeout: 15000 });
  const rows = page.getByTestId('standings-row');
  const count = await rows.count();
  const out: { userId: string; name: string; rank: number; points: number }[] = [];
  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);
    out.push({
      userId: (await row.getAttribute('data-user-id')) ?? '',
      name: ((await row.getByTestId('standings-name').textContent()) || '').trim(),
      rank: Number(await row.getAttribute('data-rank')),
      points: Number(await row.getByTestId('standings-points').getAttribute('data-points')),
    });
  }
  return out;
}

// Steps the leaderboard back N Monday–Sunday weeks from "this week".
export async function goToPreviousWeeks(page: Page, weeks: number) {
  await page.goto('/leaderboard');
  await expect(page.getByLabel('Previous week')).toBeVisible({ timeout: 15000 });
  for (let i = 0; i < weeks; i++) {
    await page.getByLabel('Previous week').click();
    await page.waitForTimeout(400);
  }
}

// Sets the admin "hide trios until toss" toggle for today (IST) on/off via
// the real /admin UI. `adminPage` must be signed in as an admin.
export async function setVisibilityToggle(adminPage: Page, enabled: boolean) {
  await adminPage.goto('/admin');
  const toggleButton = adminPage.getByRole('button', { name: /hide trios until toss/i });
  const dateInput = adminPage.getByLabel(/applies to/i);
  await expect(dateInput).toBeVisible({ timeout: 15000 });

  // Match the app's IST-anchored "today" (CLAUDE.md item #8).
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  await dateInput.fill(today);

  // The toggle's state isn't queryable directly — read the switch knob's class.
  const knob = toggleButton.locator('span > span');
  const isOn = await knob.evaluate((el) => el.className.includes('translate-x-5'));
  if (isOn !== enabled) await toggleButton.click();

  await adminPage.getByRole('button', { name: /save visibility settings/i }).click();
  await expect(
    adminPage.getByText(enabled ? /armed: trios hidden until toss/i : /visibility toggle turned off/i)
  ).toBeVisible({ timeout: 10000 });
}

// Finalizes a completed match through the real admin UI on its draft page
// (the "Finalize" card, isAdmin && isCompleted). `adminPage` must already be
// signed in as an admin.
export async function finalizeMatchAsAdmin(adminPage: Page, matchId: string) {
  await adminPage.goto(`/matches/${matchId}`);
  const finalizeBtn = adminPage.getByRole('button', { name: /^(Finalize|Re-finalize)$/ });
  await expect(finalizeBtn).toBeVisible({ timeout: 15000 });
  await finalizeBtn.click();
  await expect(adminPage.getByText(/Scored \d+ trio/i)).toBeVisible({ timeout: 25000 });
}
