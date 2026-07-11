# CricBudz 🏏

A private, invite-only fantasy cricket app for a small friend group, built around the IPL. Not a public product — no SEO/scale concerns by design (see `PROGRESS.md` for that and other standing architecture decisions).

Each match, every user drafts a 3-player "trio" (from both playing teams), tags one player as MVP (2x points), and competes on a leaderboard. Live fixture/roster data comes from Cricbuzz via RapidAPI.

**Production:** https://ipl-fantasy-arena.vercel.app

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
│   │   │   └── finalize-match/       # Admin-only: fetch scorecard, score every squad for a match
│   │   │
│   │   ├── admin/
│   │   │   └── page.tsx              # Dev Control Center: date override, submission visibility toggle
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
│   │   ├── firebase.ts               # Client SDK (reads, user-squad writes); connects to emulators in E2E
│   │   ├── firebase-admin.ts         # Server-only Admin SDK (bypasses Firestore rules)
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
│   └── set-admin-claim.mjs           # One-time script to grant a user the `admin` custom claim
│
├── e2e/                               # Playwright specs, run against the Firebase Emulator Suite
│   ├── seed.ts / testData.ts         # Fixed test users/matches/players seeded before each run
│   ├── fixtures.ts                   # signInAsUser/signInAsUser2/signInAsAdmin test fixtures
│   └── *.spec.ts
├── vitest.config.ts                  # Unit/component test config (jsdom + RTL)
├── playwright.config.ts              # E2E test config (webServer + globalSetup seeding)
├── firestore.rules                   # Deployed via `firebase deploy --only firestore:rules`
├── firebase.json / .firebaserc       # Firebase CLI project/rules/emulator config
├── public/
│   ├── manifest.json                 # PWA manifest
│   └── icon-*.png                    # PWA icons (placeholder artwork)
├── CLAUDE.md                         # Instructions/architecture notes for AI coding agents
├── PROGRESS.md                       # Standing architecture decisions (scope, DB choice, etc.)
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

* Gated by `isAdmin` (redirects non-admins), with real server-side enforcement on the one privileged action (`/api/sync` requires a valid ID token with the `admin` claim).
* **System date override** — simulates "today" app-wide (real clock still ticks within that simulated day) for testing lock/completion logic without waiting for real IPL dates.
* **Submission visibility toggle** — see below.

## Submission Visibility Toggle

Prevents users from seeing (and copying) each other's trio picks before toss on a day the admin flags as sensitive (e.g. a close title race late in the week). Set from a "Submission Visibility" card on `/admin`:

* Admin sets `{ hideUntilToss: true, date: "YYYY-MM-DD" }` in a single `settings/visibility` document.
* The toggle only affects **that one day's** not-yet-toss matches. Past/completed matches are **always** visible to everyone regardless of the toggle. Once toss passes for a match, it becomes visible to everyone too, toggle or not.
* No cron/scheduled job needed to "reset" it — because the toggle carries the specific date it applies to, it's automatically inert for every other day without any manual cleanup.
* **Enforced in `firestore.rules`** (not just hidden in the UI) — a squad doc carries denormalized `matchTimestamp`/`matchDay` fields so the rule can evaluate "has toss passed" / "does the toggle apply today" without extra reads. See Firestore Collections below.
* Surfaced on the draft page (`/matches/[id]`) as a "Squad Room" section showing every other user's submitted trio for that match (or an explanatory hidden-until-toss message) once visible.
* Caveat: the Dev Control Center's date override is a client-only simulation — it does **not** change what time Firestore rules see (`request.time` is always the real server clock). Testing visibility transitions with the date override can therefore look inconsistent between the UI's "locked/completed" state and what the rules actually reveal; this is expected, not a bug.

## Scoring Engine

Once a match is actually complete (per Cricbuzz, not just past its assumed duration), an admin finalizes it from a "Finalize Match Scoring" card on that match's draft page (`isAdmin && isCompleted` only):

* `POST /api/finalize-match` (admin-gated, same pattern as `/api/sync`) fetches the real scorecard from `mcenter/v1/{matchId}/scard`, parses it (`src/lib/scoring.ts`), computes every submitted squad's points, and writes `totalPoints` back onto each `userSquads` doc plus a `scoring` summary onto the match doc.
* Point values live in `src/lib/scoringRules.ts` — the single source of truth shared by the `/rules` display page and the actual calculation, so they can't drift apart.
* Man of the Match is entered manually by the admin in a dropdown when finalizing (not exposed by any Cricbuzz endpoint found so far) and awards its bonus on top of whatever else that player earned.
* **"Direct Hit" is folded into the regular Runout score** — Cricbuzz's data has no field distinguishing a direct-hit run-out from an assisted one, so they're scored identically.
* Fielding credit (catches/run-outs/stumpings) comes from regex-parsing the batsman's free-text dismissal string (e.g. `"c Phil Salt b Jacob Duffy"`), matched against the two playing squads' names. **This is best-effort, not guaranteed-correct**: a real captured example showed Cricbuzz's own data being internally inconsistent — a player's own batting row said "Philip Salt" while the same match's dismissal text called him "Phil Salt". A same-surname fallback (only used when unambiguous within the two squads) recovers this specific case; see `src/lib/scoring.test.ts` for the exact real-world example.
* **The "Dot Ball" scoring rule may never actually fire** — every bowler in a real completed match checked during development returned `dots: 0`, suggesting this field either isn't populated by this API tier or isn't reliable. The code still handles it correctly if the API ever does return real values.
* Re-running "Finalize" for an already-scored match is allowed (idempotent overwrite) — useful if Cricbuzz's data was corrected after the fact.

## Weekly Leaderboard (`/leaderboard`)

* Weeks run **Monday–Sunday** (`src/lib/leaderboard.ts`). Standings are **computed live** on every page load by querying all scored squads (`totalPoints` set) whose `matchDay` falls in the selected week and summing per user — there's no separate "leaderboard" collection or scheduled rollup job to keep in sync.
* Header reads **"Week N"** (e.g. "Week 8"), numbered from the season's actual first synced match (`getEarliestMatchDate()` + `getWeekNumber()`) — not an arbitrary ISO calendar week number, which wouldn't mean anything to a user. Falls back to just showing the date range if no matches are synced yet.
* A flat ranked list — `1. Name … points`, `2. Name … points`, etc. — not a separate podium widget. Top 3 get gold/silver/bronze rank badges (#1 gets a crown icon), everyone else gets a plain numbered badge.
* Week navigation (prev/next) lets you browse any past week's final standings; "next week" is disabled once you're viewing the current week.
* Once a week has fully ended, rank #1 is labeled "Winner" and #2/#3 "Runner-up"; for the current, still-in-progress week each row instead shows how many matches that user has had scored so far, since the week isn't decided yet.
* History is implicit and free: since standings are computed from raw scored-squad data rather than a written summary, every past week remains browsable indefinitely with no extra storage.

## PWA

* Installable (manifest + icons for 192/512/maskable/apple-touch). No service worker — offline support explicitly out of scope for now.
* Mobile-first design: bottom tab bar on mobile, top nav links + no bottom bar on desktop, auto (system) + manual dark/light theme.

---

# Firestore Collections

## `matches`

Synced by `/api/sync` (Admin SDK only — Firestore rules deny client writes).

```json
{
  "id": "152240",
  "seriesId": 9241,
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
    "playerPoints": { "8497": 62, "10276": 145 }
  }
}
```

`scoring` is only present once an admin has finalized the match (see Scoring Engine above); `playerPoints` covers every player who had any tracked stat, not just the ones drafted.

Note: `status` here is whatever Cricbuzz reported *at sync time* — it does not update live. The app's own `open`/`locked`/`completed` UI state (`getMatchTimeStatus()` in `src/lib/utils.ts`) is computed client-side from `date` vs. the current time instead, since there's no live re-sync.

## `players`

Synced alongside matches, keyed by Cricbuzz player ID. `price` is currently randomized (`8 + Math.random() * 3`) — no real pricing model yet.

## `userSquads`

Client-writable, owner-only (Firestore rules enforce `userId == request.auth.uid` on create/update/delete). Doc ID is `{userId}_{matchId}`, so one squad per user per match.

```json
{
  "userId": "uid",
  "matchId": "152240",
  "players": ["123", "456", "789"],
  "mvpId": "123",
  "createdAt": 1772400000000,
  "matchTimestamp": "2026-05-22T14:00:00.000Z",
  "matchDay": "2026-05-22",
  "userDisplayName": "Pavan",
  "userPhotoURL": "https://lh3.googleusercontent.com/...",
  "totalPoints": 187
}
```

`matchTimestamp`/`matchDay` are denormalized from the match at save time specifically so Firestore rules can evaluate "has toss passed" / "does the visibility toggle apply today" without an extra document read per squad. `userDisplayName`/`userPhotoURL` are denormalized from the authenticated user for the same reason — the client SDK has no way to look up another user's profile by uid otherwise (needed for "Squad Room" and the leaderboard). `totalPoints` is absent until an admin finalizes that match's scoring.

**Read rules:** a user can always read their own squad. Another user's squad is readable once toss has passed for that match, *or* if the visibility toggle isn't active for that match's day. In practice this means every *scored* squad (finalization only ever happens post-completion, always past toss) is visible to everyone — which is exactly what the leaderboard needs.

## `settings/visibility`

Single document, admin-writable only (`request.auth.token.admin == true`), readable by any signed-in user.

```json
{ "hideUntilToss": true, "date": "2026-04-18" }
```

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

`playwright.config.ts` runs E2E specs with `workers: 1` — they share seeded emulator state (fixed test users/matches) rather than each getting an isolated database, so cross-file parallelism would cause real races.

## Deploying

```bash
vercel --prod                              # deploy app to production
firebase deploy --only firestore:rules     # deploy Firestore security rules
```

Both require being logged in (`vercel login`, `firebase login`) — see each CLI's own auth flow.

---

# Known Limitations / Not Yet Built

* **30-minute pre-toss lock is UI-only** — not enforced by Firestore rules or a server check. A determined client could bypass it. Low risk for a private friend-group app, but worth knowing.
* **Scoring accuracy depends on Cricbuzz's own data quality**, not just this codebase — see the fielding-name-mismatch and dot-ball caveats under Scoring Engine above. Treat computed scores as "very likely correct, not cryptographically guaranteed."
* **No automatic trigger for scoring** — an admin has to click "Finalize Match" once Cricbuzz reports a match complete. Deliberate: this app has no cron/background job infrastructure by design, and reliably auto-detecting "truly finished, not just rain-delayed" was judged not worth the complexity versus a manual click.
* Player `price` has no real pricing model (randomized at sync time).
* `finalize-match` isn't covered by an E2E test (it calls the real RapidAPI, which automated tests shouldn't hit) — it's covered by unit tests on the underlying parsing/calculation logic (`src/lib/scoring.test.ts`) plus a real captured API response used as a test fixture, but the route handler itself is only manually verified.

---

# Standing Architecture Decisions

See `PROGRESS.md` for the reasoning behind decisions already made and **not** up for re-litigation without a new explicit ask — most notably: staying on Firebase (no Postgres/Prisma/Better Auth migration), no SEO/SSR work, and the private/invite-only scope.
