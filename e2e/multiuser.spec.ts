import { test, expect, newAllSimUserPages, signInWithToken } from './fixtures';
import { readFileSync } from 'fs';
import {
  SIM_USERS,
  SIM_ROSTER,
  SIM_MATCH_OPEN_ID,
  SIM_MATCH_SCORED_ID,
  SIM_MATCH_SCORED_DAYS_AGO,
  TOKENS_FILE,
  simTrio,
} from './testData';
import {
  draftTrio,
  readSquadRoomNames,
  readLeaderboard,
  goToPreviousWeeks,
  finalizeMatchAsAdmin,
  setVisibilityToggle,
} from './helpers';

// The multi-user standard: one "week in the life" of 10 friends —
// concurrent drafting, cross-user Squad Room + the hide-until-toss toggle,
// then admin scoring and everyone checking the same leaderboard.
// See e2e/MULTIUSER.md for how to extend this for new features.
test.describe.configure({ mode: 'serial' });

// Draft the whole friend group in small concurrent batches: enough to
// exercise overlapping writes, gentle enough that the Next dev server +
// long-polling Firestore emulator don't choke on 10 cold draft pages at once.
async function inBatches<T>(items: T[], size: number, fn: (item: T) => Promise<unknown>) {
  for (let i = 0; i < items.length; i += size) {
    await Promise.all(items.slice(i, i + size).map(fn));
  }
}

const nameOf = (id: string) => SIM_ROSTER.find((p) => p.id === id)!.name;
const trioNamesFor = (n: number) => {
  const { players, mvpId } = simTrio(n);
  return { playerNames: players.map(nameOf) as [string, string, string], mvpName: nameOf(mvpId) };
};

test('10 friends: concurrent drafting, Squad Room + toggle, scoring, shared leaderboard', async ({ browser }) => {
  test.setTimeout(300_000); // 10 sessions x a full week of activity
  const pages = await newAllSimUserPages(browser); // pages[i] === Sim Friend i+1
  const adminPage = await (await browser.newContext()).newPage();
  const { adminToken } = JSON.parse(readFileSync(TOKENS_FILE, 'utf-8'));
  await signInWithToken(adminPage, adminToken);

  // Warm the routes once (the Next dev server compiles a route on first hit;
  // 10 simultaneous cold hits race and some navigations abort).
  for (const route of [`/matches/${SIM_MATCH_OPEN_ID}`, `/matches/${SIM_MATCH_SCORED_ID}`, '/leaderboard', '/admin']) {
    await adminPage.goto(route).catch(() => {});
  }

  // ── Phase 1: all 10 draft a distinct trio on the open match ──
  await inBatches(SIM_USERS, 3, (u) =>
    draftTrio(pages[u.n - 1], { matchId: SIM_MATCH_OPEN_ID, ...trioNamesFor(u.n) })
  );
  // Every session made it back to the dashboard = every squad was written.
  for (const p of pages) await expect(p).toHaveURL(/\/dashboard/);

  // ── Phase 2: Squad Room visibility + the hide-until-toss toggle ──
  // Toggle ON for today → Friend 1 sees nobody else's picks (match is pre-toss, today).
  await setVisibilityToggle(adminPage, true);
  expect(await readSquadRoomNames(pages[0], SIM_MATCH_OPEN_ID)).toEqual([]);

  // Toggle OFF → Friend 1 now sees the other 9, and never their own row.
  await setVisibilityToggle(adminPage, false);
  const visible = await readSquadRoomNames(pages[0], SIM_MATCH_OPEN_ID);
  expect(visible.sort()).toEqual(SIM_USERS.filter((u) => u.n !== 1).map((u) => u.displayName).sort());
  expect(visible).not.toContain('Sim Friend 1');

  // ── Phase 3: admin scores the completed match, everyone checks the board ──
  await finalizeMatchAsAdmin(adminPage, SIM_MATCH_SCORED_ID);

  const weeksBack = Math.round(SIM_MATCH_SCORED_DAYS_AGO / 7); // = 2

  // Friend 3 and Friend 7 must see the identical board.
  await goToPreviousWeeks(pages[2], weeksBack);
  const board3 = await readLeaderboard(pages[2]);
  await goToPreviousWeeks(pages[6], weeksBack);
  const board7 = await readLeaderboard(pages[6]);
  expect(board7).toEqual(board3);

  // 10 rows, ranked.
  expect(board3).toHaveLength(10);
  expect(board3[0].userId).toBe('e2e-sim-user-1');
  expect(board3[0].rank).toBe(1);

  // Ranks 1..8 strictly descending on points; rows 9 & 10 tie (user 10's
  // trio mirrors user 9's) and share a rank.
  for (let i = 0; i < 7; i++) expect(board3[i].points).toBeGreaterThan(board3[i + 1].points);
  expect(board3[8].points).toBe(board3[9].points);
  expect(board3[8].rank).toBe(board3[9].rank);

  // Every friend appears exactly once.
  expect(new Set(board3.map((r) => r.userId))).toEqual(new Set(SIM_USERS.map((u) => u.uid)));

  for (const p of pages) await p.context().close();
  await adminPage.context().close();
});
