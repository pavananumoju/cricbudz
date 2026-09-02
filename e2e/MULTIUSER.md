# Multi-user testing standard

CricBudz is used by ~10 friends who each sign in, draft trios, tag an MVP,
submit, look at each other's picks (or not, per the hide-until-toss
toggle), and compare on the weekly leaderboard. None of that can be shaken
out with one test account. This harness **simulates the whole friend group
with zero manual intervention** — no real Google logins, no real friends.

## How it works

| Piece | What it gives you |
|---|---|
| Firebase Emulator Suite (`npm run emulators`) | A throwaway Auth + Firestore. `e2e/seed.ts` fills it before every run. |
| `window.__testSignInWithCustomToken()` | Signs a browser session in as any seeded user instantly (only exists when `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true`). |
| **Playwright browser contexts** | One isolated context per "friend" — own cookies/storage = a real separate session. |
| `SIM_USERS` (10) + `SIM_ROSTER` (32 players) + `simTrio(n)` | Deterministic friend group and a distinct valid trio per friend, in `e2e/testData.ts`. User 10's trio mirrors user 9's to force a leaderboard tie. |
| `e2e/simScorecard.ts` + the fixture seam | A synthetic-but-schema-valid scorecard (`e2e/fixtures/scorecards/`), so `POST /api/finalize-match` runs the real scoring → leaderboard path deterministically. `getMatchScorecard()` reads the fixture instead of RapidAPI when the emulator flag is set. |
| `e2e/fixtures.ts` / `e2e/helpers.ts` | Shared building blocks: `newAllSimUserPages(browser)`, `signInWithToken`, `draftTrio`, `readSquadRoomNames`, `readLeaderboard`, `goToPreviousWeeks`, `setVisibilityToggle`, `finalizeMatchAsAdmin`. |

## The tiers

| Tier | File | Runs | Covers |
|---|---|---|---|
| Pure-function | `src/lib/leaderboard.test.ts` (`computeStandings — 10-user week`) · `src/lib/multiuser-sim.test.ts` | `npm run test` (no infra) | Ranking, ties/competition-ranking, partial weeks, and the exact scorecard→points→standings maths the E2E relies on. |
| Rules | `rules-tests/multiuser.rules.test.ts` | `npm run test:rules` | 10-user squad isolation: each writes only their own; hide-until-toss blocks cross-user reads pre-toss but never the owner. |
| End-to-end | `e2e/multiuser.spec.ts` | `npm run test:e2e` | "A week in the life": 10 friends draft concurrently → Squad Room + toggle → admin scores → everyone sees the identical leaderboard. |

All three run in CI on every push/PR (`.github/workflows/ci.yml`).

## Adding a multi-user check for a NEW feature

1. **Prefer a pure-function or rules test** if the logic can be reached
   without a browser — they're seconds, not minutes.
2. Otherwise add a `test(...)` to `e2e/multiuser.spec.ts` (or a sibling
   spec). Get your friends with `newAllSimUserPages(browser)` and an admin
   with `signInWithToken(adminPage, adminToken)`.
3. Reuse the helpers. If you need a new shared action/reader, put it in
   `e2e/helpers.ts` so every spec gets it.
4. Need new seed data? Add it to `e2e/seed.ts`'s "Multi-user simulation
   seed" block and a constant to `e2e/testData.ts`. Keep sim data on its
   own match IDs / two weeks back so it never perturbs the single-user
   specs.
5. Drive concurrent sessions in small batches (`inBatches(..., 3, ...)` in
   the spec) — the Next dev server + long-polling emulator choke on 10
   cold pages at once.
6. For DOM you need to assert on, add a `data-testid` rather than matching
   fragile display text (see `standings-row`, `squadroom-user`).
