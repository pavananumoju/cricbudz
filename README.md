# CricBudz 🏏

A private, invite-only fantasy cricket app for a small friend group, built around the IPL. Not a public product — no SEO/scale concerns by design (see `PROGRESS.md` for that and other standing architecture decisions).

Each match, every user drafts a 3-player "trio" (from both playing teams), tags one player as MVP (2x points), and competes on a leaderboard. Live fixture/roster data comes from Cricbuzz via RapidAPI.

**Production:** https://ipl-fantasy-arena.vercel.app

**Coming back after a break?** See [`RUNBOOK.md`](./RUNBOOK.md) — a plain-English, step-by-step maintenance checklist (health checks, season rollover, backups, dependency upgrades) written so it can be followed personally or handed wholesale to an AI coding assistant.

---

# Tech Stack

## Frontend

* Next.js 15.5.20 (App Router)
* React 18, TypeScript
* Tailwind CSS v4 (CSS-first config via `@theme`, no JS config file)
* `motion` (framer-motion successor) for sheets/animations
* `sonner` for toast notifications
* Installable PWA (manifest + icons; no service worker/offline support by design)

## Backend / APIs

* Next.js App Router route handlers
* RapidAPI — Cricbuzz Cricket API (`cricbuzz-cricket.p.rapidapi.com`)

## Database & Authentication

* Firebase Firestore (named database, not `(default)`)
* Firebase Authentication (Google sign-in only — popup primary, redirect fallback if the popup is blocked)
* Firebase Admin SDK (server-only writes, used by `/api/sync`)
* Firebase custom claims (`admin: true`) gate the one real admin action (fixture sync) — enforced server-side, not just hidden in the UI

## Hosting

* **Vercel** — frontend + API routes (`vercel --prod` from the repo; also connected to the `pavananumoju/cricbudz` GitHub repo for automatic preview deploys)
* **Firebase** — Auth + Firestore. Firestore Security Rules are deployed via the Firebase CLI (`firebase deploy --only firestore:rules`), configured in `firebase.json`/`.firebaserc`.

There is **no AI integration** in this app (an earlier Gemini-based recommendation feature was removed entirely — not part of the product direction).

---

# Project Structure

```txt
ipl-fantasy-arena/
│
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── sync/                 # Admin-only ETL: Cricbuzz -> Firestore (matches + players)
│   │   │   ├── finalize-match/       # Admin-only: fetch scorecard, score every squad for a match
│   │   │   ├── leaderboard/          # Any signed-in user: server-side week-range squad query (Admin SDK)
│   │   │   ├── matches/[matchId]/squads/  # Any signed-in user: server-side Squad Room query (Admin SDK)
│   │   │   └── admin/
│   │   │       ├── users/            # Admin-only: list users, grant/revoke the `admin` custom claim
│   │   │       └── backup/           # Admin-only: read-only full Firestore export as downloadable JSON
│   │   │
│   │   ├── admin/
│   │   │   └── page.tsx              # Dev Control Center: date override, submission visibility toggle,
│   │   │                             # Registered Users (grant/revoke admin), Data Backup
│   │   │
│   │   ├── dashboard/
│   │   │   └── page.tsx              # Today's Arena, quick links, other drafts (with delete)
│   │   │
│   │   ├── leaderboard/
│   │   │   └── page.tsx              # Weekly (Mon-Sun) standings, live-computed, with week navigation
│   │   │
│   │   ├── matches/
│   │   │   ├── [id]/
│   │   │   │   ├── _components/
│   │   │   │   │   ├── PlayerCard.tsx        # Roster item (selectable, disables when locked)
│   │   │   │   │   ├── SelectedSlots.tsx     # Trio slots, MVP tagging, locked/read-only mode
│   │   │   │   │   └── SubmissionControl.tsx # Validation status + Lock Trio action
│   │   │   │   └── page.tsx          # Trio draft arena — two-team browsing, sticky bottom sheet on
│   │   │   │                         # mobile, persistent sidebar on desktop; open/locked/completed states;
│   │   │   │                         # "Squad Room" (other users' trios) + admin "Finalize Match" scoring
│   │   │   └── page.tsx              # Fixture list, per-card status badges
│   │   │
│   │   ├── rules/
│   │   │   └── page.tsx              # Scoring rules copy
│   │   │
│   │   ├── globals.css               # Design tokens (light/dark), Tailwind v4 @theme
│   │   ├── layout.tsx                # Root layout, theme script, PWA metadata, Toaster
│   │   ├── loading.tsx
│   │   └── page.tsx                  # Landing page (Google sign-in)
│   │
│   ├── components/
│   │   ├── NavigationWrapper.tsx     # Chrome shell (TopBar/BottomNav), draft-page bypass
│   │   ├── TopBar.tsx                # Header + desktop nav links + profile trigger
│   │   ├── BottomNav.tsx             # Mobile tab bar (hidden on desktop, TopBar covers nav there)
│   │   ├── ProfileSheet.tsx          # Theme toggle, admin link, logout
│   │   └── ui/                       # Button, Card, Badge, Sheet, Skeleton
│   │
│   ├── config/
│   │   └── cricket.ts                # IPL_SERIES_ID / IPL_SEASON — the one place to roll to a new season
│   │
│   ├── context/
│   │   ├── AuthContext.tsx           # Firebase Auth (Google), isAdmin from custom claims
│   │   ├── DevContext.tsx            # localStorage-backed date override, getEffectiveNow()
│   │   └── ThemeContext.tsx          # Auto (system) + manual dark/light toggle
│   │
│   ├── lib/
│   │   ├── firebase.ts               # Client SDK (reads, user-squad writes); IndexedDB persistence in real
│   │   │                             # browsers (off in E2E); connects to emulators in E2E
│   │   ├── firebase-admin.ts         # Server-only Admin SDK (bypasses Firestore rules)
│   │   ├── adminAuth.ts              # requireAdmin()/requireAuth(): shared Bearer-token checks for API routes
│   │   ├── rapidapi.ts               # Cricbuzz endpoint wrappers
│   │   ├── draftRules.ts             # Pure, unit-tested squad validation (dual-franchise, MVP, etc.)
│   │   ├── scoringRules.ts           # Single source of truth for point values (used by /rules AND scoring.ts)
│   │   ├── scoring.ts                # Scorecard parsing + point calculation (pure, unit-tested)
│   │   ├── leaderboard.ts            # Mon-Sun week math + standings aggregation (pure, unit-tested)
│   │   └── utils.ts                  # cn(), getTeamLogo(), getMatchTimeStatus() (open/locked/completed)
│   │
│   ├── services/
│   │   └── dataService.ts            # All client Firestore reads/writes (matches, players, userSquads)
│   │
│   ├── types/
│   │   └── index.ts                  # Player, Match, UserSquad, VisibilitySettings
│   │
│   └── firebase-applet-config.json   # Client-side Firebase config (not env vars — see src/lib/firebase.ts)
│
├── scripts/
│   ├── set-admin-claim.mjs           # One-time script to grant a user the `admin` custom claim
│   ├── backfill-squad-fields.mjs     # One-time migration: backfills matchTimestamp/matchDay/user* on old userSquads
│   ├── backfill-squad-playernames.mjs # One-time migration: backfills playerNames on old userSquads (see below)
│   ├── backfill-seriesid.mjs         # One-time migration: normalizes matches.seriesId to string (dry-run by default)
│   └── restore-firestore.mjs         # CLI-only Firestore restore from a backup JSON (dry-run by default,
│                                      # requires --confirm to write) — deliberately not a UI button
│
├── e2e/                               # Playwright specs, run against the Firebase Emulator Suite
│   ├── seed.ts / testData.ts         # Fixed test users/matches/players seeded before each run
│   ├── fixtures.ts                   # signInAsUser/signInAsUser2/signInAsAdmin test fixtures
│   └── *.spec.ts
├── rules-tests/                       # firestore.rules tests (Vitest + @firebase/rules-unit-testing)
│   ├── visibility.rules.test.ts      # Proves which multi-document queries the rules engine can/can't allow
│   ├── squadWrite.rules.test.ts      # Proves the lock window / shape / source-of-truth checks on userSquads writes
│   └── auditLog.rules.test.ts        # Proves auditLog is admin-read-only with no client write path
├── vitest.config.ts                  # Unit/component test config (jsdom + RTL)
├── vitest.rules.config.ts            # Separate Node-environment config for rules-tests/
├── playwright.config.ts              # E2E test config (webServer + globalSetup seeding)
├── firestore.rules                   # Deployed via `firebase deploy --only firestore:rules`
├── firestore.indexes.json            # Deployed via `firebase deploy --only firestore:indexes`
├── firebase.json / .firebaserc       # Firebase CLI project/rules/emulator config
├── public/
│   ├── manifest.json                 # PWA manifest
│   └── icon-*.png                    # PWA icons (placeholder artwork)
├── CLAUDE.md                         # Instructions/architecture notes for AI coding agents
├── PROGRESS.md                       # Standing architecture decisions (scope, DB choice, etc.)
├── RUNBOOK.md                        # Plain-English step-by-step maintenance checklist
└── README.md                         # This file
```

---

# Core Features (implemented)

## Auth

* Google sign-in only, via Firebase Auth.
* `signInWithPopup` primary (works in normal browser tabs without the cross-origin storage issues redirect-based flows hit on mobile Safari/Chrome), falling back to `signInWithRedirect` only if the popup itself is blocked/unsupported. All failures surface a toast instead of failing silently.
* Admin status (`isAdmin`) comes from a Firebase custom claim (`admin: true`), checked via `getIdTokenResult()` — not a hardcoded email check. Set via `scripts/set-admin-claim.mjs`.

## Trio Draft Arena (`/matches/[id]`)

* Exactly 3 players, from exactly 2 teams (not all 3 from one side), one tagged MVP (2x points) before locking.
* **Squads lock 30 minutes before match start ("toss")** — enforced client-side today (see Known Limitations).
* Match status is a 3-way state, not just locked/unlocked:
  * **Open** — before the lock window, fully editable.
  * **Locked** — inside the lock window through an assumed ~4h match duration (no live ball-by-ball sync exists, so "in progress" is inferred, not observed). Red banner, grayed player cards, lock icons.
  * **Completed** — after the assumed match duration has elapsed. Neutral/muted styling, distinct copy ("Match Completed" vs "Arena Locked"), so a finished match doesn't read as merely "locked."
* Two-team side-by-side browsing on all screen sizes; mobile uses a sticky bottom bar + bottom sheet for reviewing/submitting the trio, desktop shows a persistent sidebar instead.
* Users can delete a saved draft (dashboard's "Other Drafts" section, tap-to-confirm), gated to before-toss only — same rule as editing.

## Admin / Dev Control Center (`/admin`)

* Gated by `isAdmin` (redirects non-admins), with real server-side enforcement on every privileged action — `/api/sync`, `/api/finalize-match`, and `/api/admin/*` all require a valid ID token with the `admin` claim, checked via the shared `requireAdmin()` helper (`src/lib/adminAuth.ts`).
* **System date override** — simulates "today" app-wide (real clock still ticks within that simulated day) for testing lock/completion logic without waiting for real IPL dates.
* **Submission visibility toggle** — see below.
* **Registered Users** — lists every Firebase Auth user (name, email, current admin status) with a Grant/Revoke Admin button per row. Backed by `GET/POST /api/admin/users`. An admin can't revoke their own access from this screen (prevents accidental lockout).
* **Data Backup** — one-click "Download Backup" button (`GET /api/admin/backup`) exports every Firestore collection as a downloadable JSON file. Read-only and safe to click anytime. Restoring is intentionally **not** a UI button — see Reliability & Long-Term Maintenance below.

## Submission Visibility Toggle

Prevents users from seeing (and copying) each other's trio picks before toss on a day the admin flags as sensitive (e.g. a close title race late in the week). Set from a "Submission Visibility" card on `/admin`:

* Admin sets `{ hideUntilToss: true, date: "YYYY-MM-DD" }` in a single `settings/visibility` document.
* The toggle only affects **that one day's** not-yet-toss matches. Past/completed matches are **always** visible to everyone regardless of the toggle. Once toss passes for a match, it becomes visible to everyone too, toggle or not.
* No cron/scheduled job needed to "reset" it — because the toggle carries the specific date it applies to, it's automatically inert for every other day without any manual cleanup.
* Surfaced on the draft page (`/matches/[id]`) as a "Squad Room" section showing every other user's submitted trio for that match (or an explanatory hidden-until-toss message) once visible.

**Enforcement is split across two mechanisms, not just `firestore.rules`.** A squad doc carries denormalized `matchTimestamp`/`matchDay` fields (see Firestore Collections below) so `firestore.rules` can evaluate "has toss passed" / "does the toggle apply today" for a **single-document read** (e.g. a user reading their own squad) without extra reads — that part works as originally designed. But Firestore's rules engine can only allow a **list query** (an entire `where(...)` result set) if it can *prove* the rule holds for every possible matching document, and that proof only works when every field the rule reads is pinned by an equality filter in the query. `matchTimestamp`/`matchDay` aren't provable this way for two multi-document reads the app actually needs:

* **The leaderboard's week query** (`matchDay` as a *range*, not an equality filter).
* **Squad Room's cross-user query for a match on the toggle's own day** — even once toss has passed for that specific match, the rule can't prove it across the whole result set, because "has toss passed" depends on `matchTimestamp`, a field no query filter can usefully pin.

Both were previously implemented as direct client Firestore queries, which meant the entire query was silently rejected (caught, and treated as "no data") on any day the toggle was on — blanking the leaderboard and every Squad Room for the whole day, not just the one match/day the toggle was meant to hide. (See `rules-tests/visibility.rules.test.ts` for the emulator-verified proof of exactly which queries fail and why, run via `npm run test:rules`.)

Fixed by moving both reads server-side, where the same visibility policy is applied in TypeScript instead of Firestore rules (the Admin SDK bypasses rules entirely, so this is safe — it's server code, not something a client can spoof):

* `GET /api/leaderboard?startDay=...&endDay=...` — any signed-in user (not admin-gated). Returns every squad in the day range that has `totalPoints` set. A squad only gets `totalPoints` once an admin finalizes its match, which only ever happens well after toss — so "has `totalPoints`" is exactly the set of squads the toggle was never meant to hide.
* `GET /api/matches/[matchId]/squads` — any signed-in user. Reads the match doc + all its squads via the Admin SDK, then filters in code using the real match start time and the real server clock: a squad is returned if the caller owns it, or toss has passed for that match, or the toggle isn't hiding that match's day.

`dataService.ts`'s `getSquadsInDateRange()` and `getSquadsForMatch()` keep their original signatures and call these routes internally, so the leaderboard and draft pages didn't need to change. Direct client Firestore reads are still used (and still enforced by `firestore.rules`) for single-document cases: a user's own squad, and the `settings/visibility` doc itself.

Caveat: the Dev Control Center's date override is a client-only simulation — it does **not** change what time Firestore rules or the two API routes above see (they always use the real server clock). Testing visibility transitions with the date override can therefore look inconsistent between the UI's "locked/completed" state and what's actually enforced server-side; this is expected, not a bug.

## Scoring Engine

Once a match is actually complete (per Cricbuzz, not just past its assumed duration), an admin finalizes it from a "Finalize Match Scoring" card on that match's draft page (`isAdmin && isCompleted` only):

* `POST /api/finalize-match` (admin-gated, same pattern as `/api/sync`) fetches the real scorecard from `mcenter/v1/{matchId}/scard`, parses it (`src/lib/scoring.ts`), computes every submitted squad's points, and writes `totalPoints` back onto each `userSquads` doc plus a `scoring` summary onto the match doc.
* Point values live in `src/lib/scoringRules.ts` — the single source of truth shared by the `/rules` display page and the actual calculation, so they can't drift apart.
* Man of the Match is entered manually by the admin in a dropdown when finalizing (not exposed by any Cricbuzz endpoint found so far) and awards its bonus on top of whatever else that player earned.
* **"Direct Hit" is folded into the regular Runout score** — Cricbuzz's data has no field distinguishing a direct-hit run-out from an assisted one, so they're scored identically.
* Fielding credit (catches/run-outs/stumpings) comes from regex-parsing the batsman's free-text dismissal string (e.g. `"c Phil Salt b Jacob Duffy"`), matched against the two playing squads' names. **This is best-effort, not guaranteed-correct**: a real captured example showed Cricbuzz's own data being internally inconsistent — a player's own batting row said "Philip Salt" while the same match's dismissal text called him "Phil Salt". A same-surname fallback (only used when unambiguous within the two squads) recovers this specific case; see `src/lib/scoring.test.ts` for the exact real-world example.
* **Unmatched names no longer fail silently.** Any batsman/bowler/fielder name `parseScorecard()` can't resolve to a synced player — beyond what the surname fallback above recovers — is collected into an `unmatched: { batsmen, bowlers, fielders }` report instead of being dropped. `POST /api/finalize-match` returns it in the response and stores it as `scoring.warnings` on the match doc (`null` once checked with nothing unmatched); the admin "Finalize" card on the draft page shows a persistent warning banner naming the unmatched names whenever `scoring.warnings` is set, plus a one-off toast right after finalizing. This can't auto-fix a scoring gap — the admin has to notice it and, if it matters, fix the roster/sync data and re-finalize — but it replaces a silent wrong score with a visible one.
* **The "Dot Ball" scoring rule may never actually fire** — every bowler in a real completed match checked during development returned `dots: 0`, suggesting this field either isn't populated by this API tier or isn't reliable. The code still handles it correctly if the API ever does return real values. The `/rules` page footnotes this (`DOT_BALL_FOOTNOTE` in `scoringRules.ts`) rather than removing the line — the rule is real, the input data just rarely shows up.
* **Finalizing now requires Cricbuzz's `ismatchcomplete` to be explicitly `true`**, not just not-`false` — a missing/undefined flag used to pass through and let a half-played match get scored. `POST /api/finalize-match` accepts a `force: true` body flag to override this for the rare legitimate case (an abandoned/rain-shortened match Cricbuzz never flags as complete); the admin finalize card has a checkbox for it, off by default, with warning copy.
* Re-running "Finalize" for an already-scored match is allowed (idempotent overwrite) — useful if Cricbuzz's data was corrected after the fact.
* **Every finalize (and re-finalize) writes an `auditLog` entry** — see "Audit Trail" below.

## Audit Trail

A minimal `auditLog` Firestore collection (Admin SDK-write-only, admin-read-only via `firestore.rules` — no client write path exists) records privileged mutations: `{ action, actorUid, matchId?, motmPlayerId?, targetUid?, at }`.

* `POST /api/finalize-match` writes a `finalize_match` entry in the same batch as the scoring write, so it's atomic with it.
* `POST /api/admin/users` writes a `grant_admin`/`revoke_admin` entry after `setCustomUserClaims` succeeds.
* The submission-visibility toggle is client-written (no API route), so instead of a separate log entry it just carries its own `updatedBy`/`updatedAt` fields on the `settings/visibility` doc itself (`setVisibilitySettings()` in `dataService.ts`).
* `auditLog` is included in `GET /api/admin/backup`'s `BACKED_UP_COLLECTIONS`. There's deliberately no admin UI to browse it yet — the data existing is what matters for now, not a viewer.

## Weekly Leaderboard (`/leaderboard`)

* Weeks run **Monday–Sunday** (`src/lib/leaderboard.ts`). Standings are **computed live** on every page load by querying all scored squads (`totalPoints` set) whose `matchDay` falls in the selected week and summing per user — there's no separate "leaderboard" collection or scheduled rollup job to keep in sync.
* Header reads **"Week N"** (e.g. "Week 8"), numbered from the season's actual first synced match (`getEarliestMatchDate()` + `getWeekNumber()`) — not an arbitrary ISO calendar week number, which wouldn't mean anything to a user. Falls back to just showing the date range if no matches are synced yet. Both `getEarliestMatchDate()` and the fixture list's `getMatches()` are scoped to `CRICKET_CONFIG.IPL_SERIES_ID`, so a prior season's matches (left in Firestore after rollover, never deleted) don't inflate the week count or show up in `/matches`.
* A flat ranked list — `1. Name … points`, `2. Name … points`, etc. — not a separate podium widget. Top 3 get gold/silver/bronze rank badges (#1 gets a crown icon), everyone else gets a plain numbered badge.
* Week navigation (prev/next) lets you browse any past week's final standings; "next week" is disabled once you're viewing the current week.
* Once a week has fully ended, rank #1 is labeled "Winner" and #2/#3 "Runner-up"; for the current, still-in-progress week each row instead shows how many matches that user has had scored so far, since the week isn't decided yet.
* History is implicit and free: since standings are computed from raw scored-squad data rather than a written summary, every past week remains browsable indefinitely with no extra storage.

## PWA

* Installable (manifest + icons for 192/512/maskable/apple-touch). No service worker — offline support explicitly out of scope for now.
* Mobile-first design: bottom tab bar on mobile, top nav links + no bottom bar on desktop, auto (system) + manual dark/light theme.

---

# Reliability & Long-Term Maintenance

This app is expected to sit untouched for months between IPL seasons, so a
few things were deliberately built to fail loudly and stay recoverable
rather than silently drift or lose data. See [`RUNBOOK.md`](./RUNBOOK.md)
for the step-by-step checklist; this section covers the *why*.

## RapidAPI response validation (fail loudly, not silently wrong)

Cricbuzz (the actual data source behind RapidAPI) can change its response
shape without warning, since it's a third party we don't control. Two
different failure modes are handled differently on purpose:

* **Scorecard fetch (`/api/finalize-match`)** — the shape Cricbuzz returns
  is validated at runtime with a Zod schema (`ScorecardResponseSchema` in
  `src/lib/scoring.ts`, via `validateScorecardResponse()`) before any
  points are calculated. The schema uses `.passthrough()` so *new* fields
  Cricbuzz adds don't break anything — only a *missing or retyped* field
  the scoring engine actually depends on does. If that happens, the route
  throws a specific error (naming the exact field path) and returns
  HTTP 502 **instead of silently computing wrong fantasy points** — wrong
  scores are worse than a visible failure here.
* **Fixture/roster sync (`/api/sync`)** — already defensively parses
  several known Cricbuzz response shapes and reports `debug` info when
  zero matches are found. Additionally, if a team's player-list response
  is missing/reshaped, the sync no longer just silently skips that team:
  it collects `teamsWithNoPlayers` and returns a `warning` string, which
  the dashboard surfaces as an orange toast so it's visible immediately
  after clicking "Sync Fixtures" rather than only in server logs.

## Firestore backup & restore

* **Backup:** `/admin`'s "Download Backup" button (`GET /api/admin/backup`,
  admin-gated) reads every collection in `BACKED_UP_COLLECTIONS` (`matches`,
  `players`, `userSquads`, `settings`, `auditLog`) and returns it as one
  downloadable JSON file. Read-only, safe to click anytime, no write path
  involved.
* **Restore:** deliberately a script, not a button —
  `node --env-file=.env.local scripts/restore-firestore.mjs <backup.json>`.
  Defaults to a dry run (prints what it *would* restore, writes nothing);
  add `--confirm` to actually overwrite. Restoring can clobber live data
  with stale data, so it should always require someone deliberately
  running a command, never a misclick.

## Admin auth: one shared helper

All admin-only API routes (`/api/sync`, `/api/finalize-match`,
`/api/admin/users`, `/api/admin/backup`) verify the caller through the same
`requireAdmin(req)` helper (`src/lib/adminAuth.ts`) — checks the Bearer
token, verifies it via `getAdminAuth().verifyIdToken()`, and confirms the
`admin` custom claim. One implementation to keep correct instead of four
copies that could quietly drift apart.

## Client-side Firestore cache (audit item #6)

`src/lib/firebase.ts` initializes the client Firestore SDK with
`persistentLocalCache` (IndexedDB-backed) in every real browser session —
disabled when `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true` (E2E), since each
Playwright run seeds a fresh emulator dataset and a cache surviving between
runs would make specs flaky in a way production never is.

**What this does and doesn't do:** it makes reads durable offline (a
`getDocs()` call falls back to the last-synced local snapshot instead of
failing outright when the network drops) and is the prerequisite for any
future move to `onSnapshot` listeners for genuinely instant warm-navigation
repaints. It does **not**, on its own, reduce Firestore's billed doc-read
count or skip the loading skeleton on a warm dashboard/fixtures/leaderboard
revisit today — every read in `dataService.ts` is a one-shot `getDocs()`/
`getDoc()` call, and the Firestore Web SDK's default (`source: 'default'`)
behavior for those is server-first whenever the client is online, using the
local cache only as an offline fallback. Actually skipping the skeleton on
every revisit would mean deliberately serving `getDocsFromCache()` results
first (accepting real staleness — e.g. a just-synced match or just-scored
squad not showing up until a hard refresh) or switching to `onSnapshot`
listeners kept alive across navigation. That's a larger, riskier change
(especially for `getMatches()`/`getSquadsForMatch()`, where staleness would
mean a real user seeing outdated fixtures or scores) that wasn't made in
this pass — flagged here rather than implemented silently.

There is no pull-to-refresh gesture in the app; the closest thing is a hard
browser refresh (always re-reads from the server first) or, for fixture
data specifically, the admin "Sync Fixtures" button on `/dashboard`, which
reloads the page after syncing.

---

# Firestore Collections

## `matches`

Synced by `/api/sync` (Admin SDK only — Firestore rules deny client writes).

```json
{
  "id": "152240",
  "seriesId": "9241",
  "team1Id": 255,
  "team1": "SRH",
  "team2Id": 59,
  "team2": "RCB",
  "date": "2026-05-22T14:00:00.000Z",
  "venue": "Ground Name",
  "city": "Hyderabad",
  "status": "COMPLETE",
  "matchDesc": "67th Match",
  "seriesName": "Indian Premier League 2026",
  "updatedAt": "2026-03-01T00:00:00.000Z",
  "scoring": {
    "finalizedAt": "2026-05-22T20:15:00.000Z",
    "motmPlayerId": "8497",
    "playerPoints": { "8497": 62, "10276": 145 },
    "warnings": null
  }
}
```

`scoring.warnings` is `null` once a finalize has run and every scorecard name resolved to a synced player, or `{ batsmen: string[], bowlers: string[], fielders: string[] }` naming whichever ones didn't (see Scoring Engine above). Absent entirely on matches finalized before this field existed.

`scoring` is only present once an admin has finalized the match (see Scoring Engine above); `playerPoints` covers every player who had any tracked stat, not just the ones drafted.

Note: `status` here is whatever Cricbuzz reported *at sync time* — it does not update live. The app's own `open`/`locked`/`completed` UI state (`getMatchTimeStatus()` in `src/lib/utils.ts`) is computed client-side from `date` vs. the current time instead, since there's no live re-sync.

`seriesId` is written as a **string** at sync time (`/api/sync` coerces Cricbuzz's raw numeric `seriesId` via `String()`), to match `CRICKET_CONFIG.IPL_SERIES_ID`'s type — `getMatches()` and `getEarliestMatchDate()` (`src/services/dataService.ts`) both filter `where('seriesId', '==', CRICKET_CONFIG.IPL_SERIES_ID)` so a prior season's fixtures (still sitting in Firestore after rollover) never leak into the current season's match list or leaderboard week count. Matches synced before this filter existed had a numeric `seriesId`; they were backfilled once via `scripts/backfill-seriesid.mjs` (same dry-run-by-default pattern as `scripts/backfill-squad-fields.mjs`) — a season-rollover sync only ever writes the string form going forward, so this shouldn't need re-running. `userSquads` deliberately does **not** carry a `seriesId` field — week-browsing is already date-driven (`matchDay`) and naturally excludes old seasons without one.

## `players`

Synced alongside matches, keyed by Cricbuzz player ID. `price` is randomized (`8 + Math.random() * 3`) once, the first time a player is seen — no real pricing model yet. Re-syncing never touches the `price` of a player that already has one, so prices don't shuffle on every "Sync Fixtures" click.

## `userSquads`

Client-writable, owner-only (Firestore rules enforce `userId == request.auth.uid` on create/update/delete). Doc ID is `{userId}_{matchId}`, so one squad per user per match.

```json
{
  "userId": "uid",
  "matchId": "152240",
  "players": ["123", "456", "789"],
  "playerNames": ["Player One", "Player Two", "Player Three"],
  "mvpId": "123",
  "createdAt": 1772400000000,
  "matchTimestamp": "2026-05-22T14:00:00.000Z",
  "matchDay": "2026-05-22",
  "userDisplayName": "Pavan",
  "userPhotoURL": "https://lh3.googleusercontent.com/...",
  "totalPoints": 187
}
```

`matchTimestamp`/`matchDay` are denormalized from the match at save time specifically so Firestore rules can evaluate "has toss passed" / "does the visibility toggle apply today" without an extra document read per squad. `userDisplayName`/`userPhotoURL` are denormalized from the authenticated user for the same reason — the client SDK has no way to look up another user's profile by uid otherwise (needed for "Squad Room" and the leaderboard). `playerNames` (same order as `players`) is denormalized from the selected `Player` objects at save time (audit item #6) so the dashboard can show trio surnames without fetching the entire `players` collection (~250 docs) just to resolve 3-6 IDs. `totalPoints` is absent until an admin finalizes that match's scoring.

`playerNames` is optional on the type (`playerNames?: string[]`) because squads saved before this field existed lack it — `scripts/backfill-squad-playernames.mjs` (dry-run via `--dry-run`, same pattern as `backfill-squad-fields.mjs`) backfills it by looking up each player ID once (cached across squads) and is safe to re-run (skips docs that already have a correctly-sized `playerNames`). The dashboard falls back to `"..."` for any squad still missing it. `firestore.rules`' `isValidSquadShape()` now also requires `playerNames` to be a 3-element list on every create/update, so every *new* write always carries it regardless of whether the backfill has run — the backfill only matters for displaying pre-existing squads correctly.

**Read rules:** a user can always read their own squad. Another user's squad is readable once toss has passed for that match, *or* if the visibility toggle isn't active for that match's day — this is what `firestore.rules` enforces for single-document reads. Multi-document reads (the leaderboard, Squad Room) can't be proven safe by Firestore's rules engine for this rule and go through server-side API routes instead — see "Submission Visibility Toggle" above for why and how.

**Write rules:** `firestore.rules` enforces the 30-minute pre-toss lock, squad shape, and the denormalized fields — not just the UI. On every create/update/delete: the write is rejected once `request.time` is past `matchTimestamp - 30min` (toss); on create/update, one extra read (`get()` on the linked `matches/{matchId}` doc) cross-checks that the submitted `matchTimestamp` exactly matches the match's real `date`, and that `matchDay` is a literal prefix of it — so a client can't spoof either field to fake a still-open lock window or dodge the visibility toggle. Shape is validated too: `players` and `playerNames` must each be a list of exactly 3, `mvpId` must be one of `players`, and the doc ID must equal `{userId}_{matchId}`. The dual-franchise check stays client/UI-only (`draftRules.ts`) since it needs player-team data the rules engine doesn't have — low-value to duplicate server-side. See `rules-tests/squadWrite.rules.test.ts` for the full enforced/rejected matrix.

## `settings/visibility`

Single document, admin-writable only (`request.auth.token.admin == true`), readable by any signed-in user.

```json
{ "hideUntilToss": true, "date": "2026-04-18", "updatedBy": "uid", "updatedAt": 1772400000000 }
```

`updatedBy`/`updatedAt` are written by `setVisibilitySettings()` (`dataService.ts`) itself — this is the one privileged mutation with no API route to log through, so it carries its own lightweight trail directly on the doc instead of an `auditLog` entry.

## `auditLog`

Write-only from the client's perspective (every real write goes through the Admin SDK, which bypasses `firestore.rules` entirely); admin-read-only, no client write path at all. One doc per privileged mutation:

```json
{ "action": "finalize_match", "actorUid": "uid", "matchId": "152240", "motmPlayerId": "8497", "at": "2026-05-22T20:15:00.000Z" }
```

`action` is one of `finalize_match`, `grant_admin`, `revoke_admin`. `matchId`/`motmPlayerId` only appear on `finalize_match`; `targetUid` (the user whose admin status changed) only appears on `grant_admin`/`revoke_admin`. See "Audit Trail" under Scoring Engine above for which routes write to it. No admin UI browses this collection yet — deliberately deferred, since the data existing is what matters right now.

---

# Configuration

## `src/config/cricket.ts`

The single place to roll over to a new IPL season:

```ts
export const CRICKET_CONFIG = {
  IPL_SERIES_ID: '9241',
  IPL_SEASON: '2026',
};
```

## Environment Variables (`.env.local`)

```env
RAPIDAPI_KEY=
RAPIDAPI_HOST=cricbuzz-cricket.p.rapidapi.com

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=      # keep \n escaped; firebase-admin.ts unescapes at runtime
FIREBASE_DATABASE_ID=      # named Firestore database, not "(default)"
```

Client-side Firebase config comes from `src/firebase-applet-config.json`, not env vars (client Firebase API keys aren't secret — security is enforced by Firestore rules, not key secrecy).

---

# Development Commands

```bash
npm run dev      # start dev server
npm run build    # production build
npm run start    # run production build
npm run lint     # next lint
```

## Testing

**Unit/component tests (Vitest + React Testing Library)** — no setup needed, pure functions and components in isolation:

```bash
npm run test          # run once
npm run test:watch    # watch mode
```

Covers `getMatchTimeStatus()` (open/locked/completed logic), the draft validation rules (`src/lib/draftRules.ts`), `PlayerCard`'s selected/disabled states, the scoring engine (`src/lib/scoring.ts` — dismissal parsing, bonus thresholds, the real-world name-mismatch fallback), and the leaderboard's Monday–Sunday week-boundary math (`src/lib/leaderboard.ts`). Add new test files as `*.test.ts(x)` next to the code they cover.

**End-to-end tests (Playwright + Firebase Emulator Suite)** — drives a real browser through actual signed-in flows (draft → lock → submit, the submission-visibility toggle across two separate simulated users). Runs against the emulator, never real Firestore data:

```bash
npm run emulators   # start Auth + Firestore emulators (needs Java 21+; keep running)
npm run test:e2e    # in another terminal — seeds the emulator, then runs the suite
```

How auth works in E2E without real Google OAuth: `e2e/seed.ts` creates fixed test users directly in the Auth emulator and mints custom tokens for them. `AuthContext.tsx` exposes a `window.__testSignInWithCustomToken()` hook that only ever attaches when `NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true` (which Playwright's `webServer` config sets) — it's structurally a no-op in any real deployment. The seed also pre-writes a couple of already-scored squads (bypassing the real finalize-match API, which calls the real RapidAPI) so `leaderboard.spec.ts` can exercise the real Firestore query + rules + rendering pipeline without a live scorecard fetch.

`playwright.config.ts` runs E2E specs with `workers: 1` — they share seeded emulator state (fixed test users/matches) rather than each getting an isolated database, so cross-file parallelism would cause real races. Its `webServer.env` also sets `FIRESTORE_EMULATOR_HOST`/`FIREBASE_AUTH_EMULATOR_HOST` — needed because server-side API routes (e.g. `/api/leaderboard`) use the Admin SDK, which isn't gated by `NEXT_PUBLIC_USE_FIREBASE_EMULATOR` (that only affects the client SDK); without it the dev server under test would call real production Firestore/Auth using `.env.local`'s real credentials instead of the seeded emulator data.

**Firestore rules tests (Vitest + `@firebase/rules-unit-testing`)** — exercises `firestore.rules` directly against the emulator, independent of the app. `visibility.rules.test.ts` proves which multi-document queries Firestore's rules engine can and can't allow under the submission-visibility toggle (see "Submission Visibility Toggle" above); `squadWrite.rules.test.ts` proves the write-side lock window, shape validation, and source-of-truth cross-check on `userSquads` (see "Write rules" under Firestore Collections above); `auditLog.rules.test.ts` proves `auditLog` is admin-read-only with no client write path at all (see "Audit Trail" under Scoring Engine above). Since `request.time` in rules is always the real server clock (no time-mocking hook, and the app's date override doesn't reach rules evaluation), tests simulate pre/post-toss by computing each squad's `matchTimestamp` relative to the real `Date.now()` rather than mocking time itself:

```bash
npm run test:rules   # boots the Firestore emulator for the duration of the run, no separate `npm run emulators` needed
```

`rules-tests/*.rules.test.ts` files run in a Node environment (`vitest.rules.config.ts`), separate from the jsdom-based `vitest.config.ts` used for `npm run test`.

## Deploying

```bash
vercel --prod                                # deploy app to production
firebase deploy --only firestore:rules       # deploy Firestore security rules
firebase deploy --only firestore:indexes     # deploy Firestore composite indexes
```

Both require being logged in (`vercel login`, `firebase login`) — see each CLI's own auth flow. Composite indexes (`firestore.indexes.json`) are needed for queries that combine an equality filter with an `orderBy` on a different field — e.g. `getMatches()`'s `seriesId` + `date` query — since Firestore can't serve those from its automatic single-field indexes alone.

---

# Known Limitations / Not Yet Built

* **Scoring accuracy depends on Cricbuzz's own data quality**, not just this codebase — see the fielding-name-mismatch and dot-ball caveats under Scoring Engine above. Treat computed scores as "very likely correct, not cryptographically guaranteed."
* **No automatic trigger for scoring** — an admin has to click "Finalize Match" once Cricbuzz reports a match complete. Deliberate: this app has no cron/background job infrastructure by design, and reliably auto-detecting "truly finished, not just rain-delayed" was judged not worth the complexity versus a manual click.
* Player `price` has no real pricing model (randomized at sync time).
* `finalize-match` isn't covered by an E2E test (it calls the real RapidAPI, which automated tests shouldn't hit) — it's covered by unit tests on the underlying parsing/calculation logic (`src/lib/scoring.test.ts`) plus a real captured API response used as a test fixture, but the route handler itself is only manually verified.

---

# Standing Architecture Decisions

See `PROGRESS.md` for the reasoning behind decisions already made and **not** up for re-litigation without a new explicit ask — most notably: staying on Firebase (no Postgres/Prisma/Better Auth migration), no SEO/SSR work, and the private/invite-only scope.
