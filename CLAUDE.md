# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

CricBudz — a fantasy cricket platform for the IPL. Users pick a 3-player "trio" squad per match (from both playing teams), tag one player as MVP (2x points), and compete on a leaderboard. Built on Next.js 15 (App Router) + React 18 + TypeScript + Tailwind, with Firebase (Auth + Firestore) and RapidAPI's Cricbuzz endpoints as the data source.

This is a **private, invite-only hobby project for a small friend group** — not a public product. SEO, scale, and multi-tenant concerns are explicitly out of scope. See `PROGRESS.md` for the reasoning behind that and other standing decisions (e.g. staying on Firebase over a Postgres/Prisma migration) — check it before proposing architecture changes so you're not re-litigating something already decided.

## Commands

```bash
npm run dev      # start dev server
npm run build    # production build
npm run start    # run production build
npm run lint     # next lint (eslint-config-next)
```

There is no test suite configured in this repo.

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

**Two separate Firebase SDK paths.** `src/lib/firebase.ts` is the client SDK (used by all `'use client'` pages/components and `src/services/dataService.ts` for reads and user-squad writes). `src/lib/firebase-admin.ts` is the server-only Admin SDK (used only by `/api/sync`) and requires `FIREBASE_DATABASE_ID` — it does not fall back to the client's named database automatically. Firestore security rules (`firestore.rules`) deny all writes to `matches`/`players` from clients; only `userSquads` is client-writable, and only by its owner (`userId` doc field must match `request.auth.uid`).

**Data flow / ETL.** `GET /api/sync` (`src/app/api/sync/route.ts`) is the only path that populates `matches` and `players` in Firestore. It calls Cricbuzz via `src/lib/rapidapi.ts`, using `CRICKET_CONFIG.IPL_SERIES_ID`/`IPL_SEASON` from `src/config/cricket.ts` as the single place to roll over to a new IPL season. It parses several possible Cricbuzz response shapes defensively, batches Firestore writes per match, and rate-limits team-player fetches with a manual 1.5s sleep. Player `price` is currently randomized (`8 + Math.random() * 3`) — there's no real pricing model yet.

**Trio draft rules** (enforced client-side, see `_components/SubmissionControl.tsx`): exactly 3 players, players must come from exactly 2 teams (i.e. not all 3 from one side), and one of the 3 must be tagged MVP before a squad can be locked (`saveUserSquad` in `dataService.ts`, keyed as `{userId}_{matchId}` so a user has one squad per match). Squads auto-lock some time before match start ("30m pre-toss") — that logic lives in `matches/[id]/page.tsx` and is UI-only today (not enforced by Firestore rules or a server check).

**Route structure:**
- `src/app/matches/page.tsx` — fixture list (fetches all matches via `dataService.getMatches`)
- `src/app/matches/[id]/page.tsx` — the trio-draft arena, composed from `_components/` (`PlayerCard`, `SelectedSlots`, `SubmissionControl`)
- `src/app/dashboard`, `src/app/leaderboard`, `src/app/rules` — dashboard, global rankings, and rules copy (leaderboard is still hardcoded mock data, not wired to Firestore)
- `src/app/admin/page.tsx` — dev-only control panel used to set a global date override for testing match-locking logic via `DevContext`; gated client-side (cosmetic — check `PROGRESS.md`/recent history for the state of server-side admin enforcement)

**Contexts:** `AuthContext` (Firebase Auth, Google sign-in only) and `DevContext` (local-storage-backed date override for simulating "current date" during testing, read by admin page). Both wrap the app in `layout.tsx`, above `NavigationWrapper`, which conditionally renders `Sidebar` (hidden on `/` and when logged out).

**Styling:** Tailwind v4 (via `@tailwindcss/postcss`), custom fonts wired as CSS variables in `layout.tsx` (`--font-sans` = Inter, `--font-display` = Space Grotesk, `--font-mono` = JetBrains Mono). `src/lib/utils.ts` has `cn()` (clsx + tailwind-merge) and `getTeamLogo()` (Cricbuzz CDN with a hardcoded IPL-team fallback map).
