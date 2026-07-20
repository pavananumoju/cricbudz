# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

CricBudz — a fantasy cricket platform for the IPL. Users pick a 3-player "trio" squad per match (from both playing teams), tag one player as MVP (2x points), and compete on a weekly (Monday–Sunday) leaderboard. Built on Next.js 15 (App Router) + React 18 + TypeScript + Tailwind, with Firebase (Auth + Firestore) and RapidAPI's Cricbuzz endpoints as the data source. Deployed on Vercel: https://ipl-fantasy-arena.vercel.app

This is a **private, invite-only hobby project for a small friend group** — not a public product. SEO, scale, and multi-tenant concerns are explicitly out of scope. See `PROGRESS.md` for the reasoning behind that and other standing decisions (e.g. staying on Firebase over a Postgres/Prisma migration) — check it before proposing architecture changes so you're not re-litigating something already decided.

**README.md is the detailed reference** (full file structure, Firestore schemas, every feature, known limitations). Keep both README.md and this file current when you ship a change — README.md for detail, this file for orientation. **RUNBOOK.md** is a plain-English, non-technical maintenance checklist for the project owner (who may not be comfortable with the code after a long break) — if you change anything it describes (health-check commands, backup/restore, season rollover), update it too.

## Commands

```bash
npm run dev      # start dev server
npm run build    # production build
npm run start    # run production build
npm run lint     # next lint (eslint-config-next)
npm run test          # unit/component tests (Vitest + RTL)
npm run test:watch    # watch mode
npm run emulators      # start Firebase Auth+Firestore emulators (needs Java 21+; keep running)
npm run test:e2e       # Playwright E2E, against the emulator — needs `npm run emulators` running first
npm run test:rules      # firestore.rules tests (Vitest + @firebase/rules-unit-testing); boots its own emulator
```

## Environment variables (`.env.local`)

```
RAPIDAPI_KEY
RAPIDAPI_HOST=cricbuzz-cricket.p.rapidapi.com
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY      # keep \n escaped in .env; firebase-admin.ts unescapes it at runtime
FIREBASE_DATABASE_ID      # named Firestore database, not "(default)"
```

Client-side Firebase config comes from `src/firebase-applet-config.json`, not env vars (see `src/lib/firebase.ts`).

## Architecture

**Two separate Firebase SDK paths.** `src/lib/firebase.ts` is the client SDK (used by all `'use client'` pages/components and `src/services/dataService.ts` for reads and user-squad writes) — it also connects to the Firebase emulators when `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true` (E2E tests only; never true in a real deployment). `src/lib/firebase-admin.ts` is the server-only Admin SDK (used by `/api/sync` and `/api/finalize-match`) and requires `FIREBASE_DATABASE_ID` — it does not fall back to the client's named database automatically. Firestore security rules (`firestore.rules`, deployed via `firebase deploy --only firestore:rules`) deny all writes to `matches`/`players` from clients; `userSquads` is client-writable only by its owner; `settings/*` is admin-only-write, any-signed-in-user-read.

**Data flow / ETL.** `GET /api/sync` (`src/app/api/sync/route.ts`, admin-only) is the only path that populates `matches` and `players` in Firestore. It calls Cricbuzz via `src/lib/rapidapi.ts`, using `CRICKET_CONFIG.IPL_SERIES_ID`/`IPL_SEASON` from `src/config/cricket.ts` as the single place to roll over to a new IPL season. Player `price` is currently randomized (`8 + Math.random() * 3`) — there's no real pricing model yet. If a team's player-list response comes back missing/reshaped, sync no longer silently skips it — it collects the team into a `teamsWithNoPlayers` list and returns a `warning` string, surfaced as a toast on the dashboard. `seriesId` is coerced to a string at write time (Cricbuzz returns it as a number; `IPL_SERIES_ID` is a string) since `getMatches()`/`getEarliestMatchDate()` (`src/services/dataService.ts`) filter matches by `where('seriesId', '==', CRICKET_CONFIG.IPL_SERIES_ID)` — this is what keeps a prior season's fixtures (left in Firestore after rollover, never deleted) out of the current fixture list and leaderboard week count. Matches synced before this existed were backfilled via `scripts/backfill-seriesid.mjs`.

**Admin API auth.** Every admin-only route (`/api/sync`, `/api/finalize-match`, `/api/admin/users`, `/api/admin/backup`) shares one auth check: `requireAdmin(req)` in `src/lib/adminAuth.ts` — verifies the Bearer ID token and the `admin` custom claim, returning either `{ uid }` or `{ error: NextResponse }`. Don't duplicate this check inline in a new route; import and call it instead. The same file also exports `requireAuth(req)` — same Bearer-token check, no admin-claim requirement — for routes any signed-in user can call (`/api/leaderboard`, `/api/matches/[matchId]/squads`).

**Visibility toggle enforcement spans rules + two API routes, not rules alone.** `firestore.rules` enforces the `settings/visibility` policy correctly for single-document reads (a user's own squad), but Firestore's rules engine can't *prove* it for multi-document `list` queries — the leaderboard's `matchDay` range query, and Squad Room's cross-user query for a match on the toggle's own day, are both structurally unprovable and get rejected outright regardless of whether the underlying data should be visible (confirmed empirically in `rules-tests/`, run via `npm run test:rules`). `GET /api/leaderboard` and `GET /api/matches/[matchId]/squads` (both `requireAuth`, Admin SDK) reimplement the same policy in code instead. See README.md's "Submission Visibility Toggle" section for the full reasoning — read it before touching visibility-related queries or rules.

**RapidAPI shape validation (fail loudly).** `src/lib/scoring.ts` validates the Cricbuzz scorecard response against a Zod schema (`ScorecardResponseSchema`, `.passthrough()` so new fields don't break it) via `validateScorecardResponse()`, called in `/api/finalize-match` right after fetching the scorecard and before parsing it. If a field the scoring engine depends on is missing or retyped, this throws a specific error (naming the field) and the route returns HTTP 502 — deliberately refusing to compute scores rather than risk silently producing wrong points. If you see this error in practice, Cricbuzz's response shape changed; update the schema (and `parseScorecard`) to match the new shape.

**Admin Users & backup.** `/api/admin/users` (GET lists all Firebase Auth users with their admin status; POST toggles the `admin` custom claim, blocking self-revoke) and `/api/admin/backup` (GET, read-only, exports `matches`/`players`/`userSquads`/`settings` as a downloadable JSON) back the "Registered Users" and "Data Backup" cards on `/admin`. Restoring a backup is **only** `scripts/restore-firestore.mjs` (CLI, dry-run by default, requires `--confirm`) — deliberately not a UI button, since a restore can overwrite live data.

**Trio draft rules** live in `src/lib/draftRules.ts` (pure, unit-tested): exactly 3 players, from exactly 2 teams, one tagged MVP before a squad can be locked (`saveUserSquad` in `dataService.ts`, keyed as `{userId}_{matchId}`). Squads lock 30 minutes before match start ("toss") — `getMatchTimeStatus()` in `src/lib/utils.ts` computes a 3-way `open`/`locked`/`completed` state from the match date vs. current time (there's no live ball-by-ball sync, so "completed" is an assumed ~4h-after-start heuristic, not observed). This lock is enforced both client-side (UI) and server-side, via `firestore.rules`' pre-toss write checks.

**"What day is this" is canonicalized on India Standard Time, not UTC or the device's local time.** `getMatchDayIST()` (`src/lib/utils.ts`) is the one function every "today"/"which day does this match belong to" comparison goes through — the dashboard's "Today's Arena", fixtures' auto-scroll target, the visibility toggle's match-day check, and the leaderboard's Monday–Sunday week math (`src/lib/leaderboard.ts`, rewritten to use IST-anchored UTC-offset arithmetic instead of local `Date` getters, which previously made week boundaries depend on the *viewer's device timezone*). The one exception: `userSquads.matchDay` itself is still written as a UTC slice of `matchTimestamp`, not IST, because `firestore.rules`' `matchesSourceOfTruth()` enforces it as a literal regex prefix and has no timezone-aware date function — safe only because real IPL matches always start at 10:00/14:00 UTC, so the UTC slice and the IST day are always identical for actual match data (verified against all synced matches). Don't change that one write to `getMatchDayIST()` without also updating the rule.

**Submission visibility toggle**: a single `settings/visibility` doc (`{ hideUntilToss, date }`) lets an admin hide other users' trio picks for one specific day's not-yet-toss matches (e.g. to stop copying before a close week), set via a native `<input type="date">` (not free text) and compared against each match's IST day. Enforced in `firestore.rules`, not just the UI — see README.md for the exact rule logic. `userSquads` docs carry denormalized `matchTimestamp`/`matchDay`/`userDisplayName`/`userPhotoURL` fields specifically to support this and the "Squad Room" (other users' trios) UI without extra reads or client-side profile lookups.

**Scoring engine**: `POST /api/finalize-match` (admin-only) fetches the real Cricbuzz scorecard, parses it (`src/lib/scoring.ts`), and writes `totalPoints` onto every submitted squad for that match plus a `scoring` summary onto the match doc. Point values are centralized in `src/lib/scoringRules.ts` (shared by `/rules` and the calculation, so they can't drift). Known real data gaps — read the comments in `scoring.ts` and README.md's "Scoring Engine" section before changing this: Direct Hit is folded into Runout (Cricbuzz doesn't distinguish them), Man of the Match is entered manually by the admin (not exposed by the API), fielding-credit name-matching is best-effort text parsing with a surname fallback (Cricbuzz's own data has been observed using two different spellings of the same player's name within one response), and the "Dot Ball" rule may rarely fire since real bowler data checked during development returned `dots: 0`.

**Weekly leaderboard** (`src/lib/leaderboard.ts`, `/leaderboard`): Monday–Sunday weeks anchored to IST (see above), computed live from scored squads on every page load — no separate leaderboard collection or rollup job. Week navigation browses history for free since nothing needs to be pre-aggregated.

**Route structure:**
- `src/app/matches/page.tsx` — fixture list (auto-scrolls to today's match on load), per-card status badges
- `src/app/matches/[id]/page.tsx` — the trio-draft arena, composed from `_components/` (`PlayerCard`, `SelectedSlots`, `SubmissionControl`); also hosts "Squad Room" and the admin "Finalize Match" card
- `src/app/dashboard`, `src/app/leaderboard`, `src/app/rules` — dashboard, real weekly rankings, rules copy (kept in sync with `scoringRules.ts`)
- `src/app/admin/page.tsx` — gated by `isAdmin` (from a Firebase custom claim, checked server-side on every admin API route too — not just hidden client-side); date override (`DevContext`), submission visibility toggle, Registered Users (grant/revoke admin), Data Backup

**Contexts:** `AuthContext` (Firebase Auth, Google sign-in — popup primary, redirect fallback), `DevContext` (localStorage-backed date override + `getEffectiveNow()`, read by admin page and several others), `ThemeContext` (auto/manual dark-light). All wrap the app in `layout.tsx`, above `NavigationWrapper`, which renders `TopBar` + `BottomNav` (mobile tab bar; desktop uses `TopBar`'s inline nav links instead) — hidden on `/`, when logged out, and on the draft page (which has its own chrome).

**Styling:** Tailwind v4 (via `@tailwindcss/postcss`, CSS-first `@theme` config — no JS config file), custom fonts wired as CSS variables in `layout.tsx` (`--font-sans` = Inter, `--font-display` = Space Grotesk, `--font-mono` = JetBrains Mono). `src/lib/utils.ts` has `cn()` (clsx + tailwind-merge), `getTeamLogo()`, and `getMatchTimeStatus()`.

**Testing:** Vitest + React Testing Library for pure logic and components (`*.test.ts(x)` next to the code they cover). Playwright E2E specs (`e2e/`) run against the real Firebase Emulator Suite via a `window.__testSignInWithCustomToken()` hook that's structurally absent unless `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true`. See README.md's "Testing" section for the full how-it-works.

## Working with the project owner

- **Update Notion when a backlog item ships.** After implementing, verifying, and deploying a Notion-tracked backlog item, update its status on the project's own Notion page (status line, checklist, ranking-at-a-glance row).
  - Whenever a Notion backlog item's status changes on a project's own page, also update the "Progress at a glance" table on the parent Architecture Analysis homepage (https://app.notion.com/p/3a16c36e66fd81ca9473f7f1e2c59931) — both the emoji progress bar and the "Shipped X/10" count for that project's row — so the two stay in sync in the same turn, not as a separate follow-up.
