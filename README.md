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
│   │   │   └── sync/                 # Admin-only ETL: Cricbuzz -> Firestore (matches + players)
│   │   │
│   │   ├── admin/
│   │   │   └── page.tsx              # Dev Control Center: date override, submission visibility toggle
│   │   │
│   │   ├── dashboard/
│   │   │   └── page.tsx              # Today's Arena, quick links, other drafts (with delete)
│   │   │
│   │   ├── leaderboard/
│   │   │   └── page.tsx              # Global rankings (still mock data — not wired to real scores yet)
│   │   │
│   │   ├── matches/
│   │   │   ├── [id]/
│   │   │   │   ├── _components/
│   │   │   │   │   ├── PlayerCard.tsx        # Roster item (selectable, disables when locked)
│   │   │   │   │   ├── SelectedSlots.tsx     # Trio slots, MVP tagging, locked/read-only mode
│   │   │   │   │   └── SubmissionControl.tsx # Validation status + Lock Trio action
│   │   │   │   └── page.tsx          # Trio draft arena — two-team browsing, sticky bottom sheet on
│   │   │   │                         # mobile, persistent sidebar on desktop; open/locked/completed states
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
│   │   ├── firebase.ts               # Client SDK (reads, user-squad writes)
│   │   ├── firebase-admin.ts         # Server-only Admin SDK (bypasses Firestore rules)
│   │   ├── rapidapi.ts               # Cricbuzz endpoint wrappers
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
├── firestore.rules                   # Deployed via `firebase deploy --only firestore:rules`
├── firebase.json / .firebaserc       # Firebase CLI project/rules config
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
  "updatedAt": "2026-03-01T00:00:00.000Z"
}
```

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
  "matchDay": "2026-05-22"
}
```

`matchTimestamp`/`matchDay` are denormalized from the match at save time specifically so Firestore rules can evaluate "has toss passed" / "does the visibility toggle apply today" without an extra document read per squad.

**Read rules:** a user can always read their own squad. Another user's squad is readable once toss has passed for that match, *or* if the visibility toggle isn't active for that match's day.

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

There is no test suite configured in this repo.

## Deploying

```bash
vercel --prod                              # deploy app to production
firebase deploy --only firestore:rules     # deploy Firestore security rules
```

Both require being logged in (`vercel login`, `firebase login`) — see each CLI's own auth flow.

---

# Known Limitations / Not Yet Built

* **30-minute pre-toss lock is UI-only** — not enforced by Firestore rules or a server check. A determined client could bypass it. Low risk for a private friend-group app, but worth knowing.
* **Real match scoring is not implemented.** Investigated feasibility (2026-07-11): Cricbuzz's `mcenter/v1/{matchId}/scard` endpoint *does* return real structured per-player batting (runs/balls/fours/sixes/strike rate) and bowling (overs/wickets/economy/dot balls) stats for completed matches — so most of the `/rules` scoring table is buildable. Gaps found:
  * Catches/run-outs/stumpings aren't separate structured fields — they're embedded in a free-text dismissal string (`outdec`, e.g. `"c Phil Salt b Jacob Duffy"`) and need parsing.
  * "Direct Hit" (distinct from a regular run-out in the scoring rules) has no structured signal in the API — can't be reliably distinguished.
  * Man of the Match wasn't found in any endpoint checked so far.
* **Weekly leaderboard is not implemented.** `/leaderboard` is still hardcoded mock data. Planned design (see `PROGRESS.md`/Notion requirements doc): Monday–Sunday weeks, top scorer wins, next two are runners-up, history retained across weeks. Blocked on the scoring engine above.
* **Scoring trigger is planned to be admin-initiated** (e.g. a "Finalize Match" button), not automatic — this app has no cron/background job infrastructure by design, and reliably auto-detecting "truly finished, not just rain-delayed" was judged not worth the complexity versus an admin just clicking a button.
* Player `price` has no real pricing model (randomized at sync time).

---

# Standing Architecture Decisions

See `PROGRESS.md` for the reasoning behind decisions already made and **not** up for re-litigation without a new explicit ask — most notably: staying on Firebase (no Postgres/Prisma/Better Auth migration), no SEO/SSR work, and the private/invite-only scope.
