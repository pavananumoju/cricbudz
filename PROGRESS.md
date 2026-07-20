# Progress & Decisions Log

This file records decisions that aren't obvious from the code alone, so future
work (mine or an AI assistant's) doesn't accidentally re-litigate them or
mistake them for oversights.

## Scope: private hobby project, not a public product

This is a **private, invite-only project for a small friend group**. It is not
optimized for public discovery, SEO, or scale beyond that group unless
explicitly decided later. Concretely, this means:

- No SSR/SSG conversions, per-route Metadata API, `sitemap.ts`, `robots.ts`,
  or JSON-LD structured data. The app is shared directly with known users,
  not meant to be found via search.
- No payments, analytics, or error-monitoring integrations until there's
  real, non-trivial traffic to justify them.
- No admin CMS / ops tooling beyond the minimal dev-testing panel at `/admin`.

*(2026-07-09/10 sessions)* — a broader tech-stack audit against a "generic
SaaS" target (shadcn/ui, Neon+Prisma, Better Auth, full SSR/SEO, PWA, etc.)
was run at the user's request. Most of the gaps it surfaced were explicitly
rejected as out of scope for this project — see below.

## Database & Auth: staying on Firebase (Firestore + Firebase Auth)

**Decision:** deliberately staying on Firebase (Cloud Firestore + Firebase
Authentication). A migration to Neon (Postgres) + Prisma + Better Auth was
evaluated and **explicitly rejected**.

**Why:** Firebase's free Spark tier (50K Firestore reads/day, 20K writes/day,
1GB storage, 50K Firebase Auth MAU) is far beyond what a private
friend-group app will ever use. There is no real problem at this scale that
a migration would solve, so the migration cost isn't justified.

**Revisit only if:** the app scales meaningfully beyond the current private
friend group (e.g. opens up publicly, or Firestore's daily quotas start
actually being hit in practice).

## Admin panel: hardened via Firebase custom claims (2026-07-10)

The `/admin` "Dev Control Center" page (date-override for testing match-lock
behavior) and the "Sync API" trigger on `/dashboard` were originally gated
only by a hardcoded email check in client-side code — and `/admin` itself
had no gate at all (only its sidebar link was hidden). Worse, `GET
/api/sync` had **no server-side auth check whatsoever**: it was a fully
public URL that anyone could call to trigger real Firestore writes via the
Admin SDK and burn RapidAPI quota, regardless of the client-side email gate.

Fixed:
- `admin: true` custom claim set on the owner's Firebase Auth user via
  `scripts/set-admin-claim.mjs` (one-time, run with
  `node --env-file=.env.local scripts/set-admin-claim.mjs <email>`).
- `AuthContext` exposes `isAdmin`, derived from the ID token's custom claim
  — single source of truth, replacing three independent hardcoded-email
  checks (`Sidebar.tsx`, `dashboard/page.tsx`, and `/admin`'s missing one).
- `GET /api/sync` now requires an `Authorization: Bearer <idToken>` header,
  verifies it server-side via `getAdminAuth().verifyIdToken()`, and checks
  `decoded.admin === true` before doing anything (401 if missing/invalid
  token, 403 if valid but not admin).
- `/admin` page now actually redirects non-admins instead of having no
  guard.
- `firestore.rules` gained an `isAdmin()` helper (using
  `request.auth.token.admin`) for any *future* admin-only Firestore write
  from a client. Not referenced by a rule today — the one real admin action
  (`/api/sync`) writes via the Admin SDK, which bypasses security rules
  entirely, so its enforcement lives in the route handler, not in rules.

Client-side `isAdmin` checks remain (for UX — hiding admin UI from
non-admins) but are cosmetic only; the real enforcement is server-side.

## Long-term maintainability hardening (2026-07-11)

The 2026 IPL season ended and the app will sit untouched for months until
the next one. To make it safe to pick back up cold (by the owner, who may
not be comfortable with the code after a long gap, or by handing the whole
thing to an AI assistant), four things were built:

1. **`RUNBOOK.md`** — a plain-English, non-code, step-by-step maintenance
   checklist (health checks, season rollover, backups, dependency
   upgrades) written to be followed personally or handed wholesale to an
   AI coding assistant. Kept deliberately separate from `CLAUDE.md`
   (technical/AI-oriented) and `README.md` (technical/detailed reference).
2. **RapidAPI fail-loud validation** — Cricbuzz can change its response
   shape without warning since it's a third party outside our control.
   The scorecard fetch (`finalize-match`) is now validated at runtime via
   a Zod schema (`src/lib/scoring.ts`); a shape mismatch throws a specific
   error and returns HTTP 502 instead of silently computing wrong fantasy
   points. The fixture/roster sync now also surfaces a `warning` (toast on
   the dashboard) if a team's player list comes back empty/reshaped,
   instead of silently syncing zero players for that team.
3. **Admin Users page** — `/admin` now lists every registered user (name,
   email, admin status) with Grant/Revoke Admin buttons (`/api/admin/users`).
   Deliberately kept to just those fields per explicit ask — no photos,
   activity stats, or other elaboration.
4. **Firestore backup/restore** — `/admin` has a one-click, read-only
   "Download Backup" button exporting all data as JSON. Restoring is
   **only** a CLI script (`scripts/restore-firestore.mjs`, dry-run by
   default, requires `--confirm`) — deliberately not a UI button, since a
   misclick on "restore" could silently overwrite live data with stale
   data. This asymmetry (easy backup, deliberately-frictioned restore) is
   intentional, not an oversight.

Also: the four admin API routes were retrofitted to share one
`requireAdmin()` auth helper (`src/lib/adminAuth.ts`) instead of each
duplicating the same Bearer-token/custom-claim check inline.

**Not done in this pass:** consolidating "Sync Fixtures" (dashboard) and
"Finalize Match" (per-match draft page) into the new admin Users page —
the user's simplified spec for that page was just users/admin-status, so
those actions were deliberately left where they already were.

## Visibility toggle: leaderboard/Squad Room list queries moved server-side (2026-07-19)

An architecture audit claimed the "hide trios until toss" admin toggle blanked the leaderboard and every Squad Room for the entire day it was set, due to two root causes: (A) Firestore rules being unprovable for the leaderboard's and Squad Room's `list` queries, and (B) `hasTossPassed()` comparing `timestamp.value(matchTimestamp)` against an ISO string instead of epoch millis.

Before changing anything, wrote Firestore-emulator rules tests (`rules-tests/`, `npm run test:rules`) to confirm both claims. **Root cause A was real; root cause B was not** — `timestamp.value()` parses an ISO 8601 string correctly in practice (verified with both a post-toss case that succeeds and a pre-toss control case that still correctly denies). Don't re-introduce a `matchStartMs`/epoch-millis field to "fix" root cause B — there's nothing to fix.

Root cause A also turned out to be more specific than described: pinning `matchDay` via an equality filter alongside `matchId` *does* make Squad Room's query provable for a match on a **different** day than the toggle's date, but **not** for a match on the toggle's own day even after toss has passed for it — `hasTossPassed()` still depends on `matchTimestamp`, an unconstrained per-document field. This isn't a rules bug to fix; it's a structural limit of Firestore's list-query provability (it can't prove a rule that depends on `request.time` compared against a field no equality/range filter pins). See `rules-tests/visibility.rules.test.ts` for the empirical proof.

**Fix:** `GET /api/leaderboard` and `GET /api/matches/[matchId]/squads` (both Admin SDK, any signed-in user via `requireAuth()`) reimplement the same visibility policy in TypeScript, using the real match doc and the server's own clock. `firestore.rules` itself is **unchanged** — it's still correct and still the enforcement mechanism for single-document reads (a user's own squad). `dataService.ts`'s `getSquadsInDateRange()`/`getSquadsForMatch()` kept their signatures and now call these routes internally, so no page-level code needed to change. Full reasoning and the exact provability boundary: README.md's "Submission Visibility Toggle" section.

**Revisit if:** audit item #2 (locking squad edits after toss server-side) gets picked up — `GET /api/matches/[matchId]/squads` is a natural place to also enforce a matching write-side check, since it already computes "has toss passed" for that match server-side.

**Prod-verified 2026-07-20:** this fix (and item #2 below) sat committed-but-unpushed on `feature/fantasy-team-rules` for a day, meaning `main`/Vercel production was still running the old code that made these two routes 404. Pushed to `main` and deployed via `vercel --prod`, then hit the real production endpoints (`https://ipl-fantasy-arena.vercel.app`) with a real ID token minted for a real user via a throwaway Node script (not the emulator): `GET /api/leaderboard` and `GET /api/matches/[matchId]/squads` both returned real, non-empty squad data. Script deleted after the run — see the squad-writes entry below for the same script's other checks.

## Squad writes locked server-side via firestore.rules (2026-07-20)

Audit item #2: `firestore.rules` only ever checked ownership on `userSquads` writes — no time check, no shape check, no validation of the client-supplied denormalized `matchTimestamp`/`matchDay`. A browser-console user could edit their trio after toss (or after the match), submit a malformed squad, or spoof `matchTimestamp`/`matchDay` to dodge the visibility toggle. Confirmed all four holes empirically first (`rules-tests/squadWrite.rules.test.ts`, written against the *unmodified* rules and initially asserting they were accepted) before changing anything.

**Fix, in `firestore.rules` alone — no new field, no backfill:** the audit assumed a `matchStartMs` epoch-millis field would be needed (carried over from an earlier draft of item #1 that was ultimately *not* built that way — see the visibility-toggle entry above: `timestamp.value()` already parses the existing ISO `matchTimestamp` string correctly). Reused that same finding here instead of introducing a new field:

* **Lock window** — `create`/`update`/`delete` all now require `!hasTossPassed(matchTimestamp)` (the same helper the read rule already used), using the doc's *existing* `matchTimestamp` on delete/pre-update-check and the *incoming* one on create/update.
* **Source-of-truth cross-check** — one extra `get()` on the linked `matches/{matchId}` doc per create/update verifies `request.resource.data.matchTimestamp == match.date` exactly, and that `matchDay` is a literal prefix of it (rules has no substring/slice operator, so this is done via a `matches()` regex anchor: `matchTimestamp.matches(matchDay + 'T.*')`). This closes the spoofing hole for both fields in one check, since the visibility toggle's `matchDay` gate and `hasTossPassed`'s `matchTimestamp` are now pinned to real match data.
* **Shape validation** — `players` must be a list of exactly 3, `mvpId` must be one of them, and the doc ID must equal `{userId}_{matchId}` (mirrors `draftRules.ts`). The dual-franchise check stays client-only — needs player-team data the rules engine doesn't have, and isn't meaningfully exploitable on its own.

`/api/finalize-match` (Admin SDK) bypasses rules entirely and is unaffected. No client-side messages, UX, or `dataService.ts` changed — this is a pure backstop; the honest pre-lock create/edit/delete flow is byte-for-byte the same request shape as before, just now also accepted by rules instead of merely trusted. Full enforced/rejected matrix: `rules-tests/squadWrite.rules.test.ts` (21/21 rules tests, 69/69 unit tests, 8/8 E2E all green after the change).

**Deployed and prod-verified 2026-07-20.** Emulator tests are necessarily a simulation — `timestamp.value()`'s ISO-string-parsing behavior isn't documented by Firebase (official docs only cover epoch millis), and emulator/production timestamp-handling mismatches have a history of filed GitHub issues — so emulator-green wasn't treated as proof production behaves the same way. Before deploying: re-ran `npm run test:rules` (21/21 still green), then fetched the *actual live* ruleset from the Firebase Rules API (not git history) for the app's real named database and diffed it against local `firestore.rules` to confirm exactly what was about to change. Deployed via `firebase deploy --only firestore:rules`, then re-fetched the live ruleset and confirmed it was now byte-identical to local.

Then ran a throwaway Node script (`scripts/verify-prod-rules.mjs`, deleted after use) against **real production Firestore** — signed in as a real user via a freshly minted custom token (no password ever handled), and, since the 2026 IPL season had already ended and prod had zero future matches, created one throwaway `matches` doc via the Admin SDK (bypasses rules; only used as fixture data, not to test anything) to serve as an "open, pre-toss" match:

* Write to a real **finished** match → `permission-denied` ✅
* Write to the throwaway **open** match → succeeded ✅ (proves the rule isn't just denying everything)
* Write with a **spoofed `matchTimestamp`** (mismatched vs. the real match doc) → `permission-denied` ✅
* Write with **4 players** instead of 3 → `permission-denied` ✅

All test writes were reverted (squad doc restored to its prior state, throwaway match doc deleted) and confirmed via a separate Admin SDK read after cleanup. Full matrix in the script's run output; script itself was throwaway and is no longer in the repo.

## AI recommendations: removed

The Gemini-powered "AI Assist" trio suggestion feature (`/api/recommend`)
was removed 2026-07-09 — not needed for how this app is actually used by the
friend group. The dependency (`@google/generative-ai`) was uninstalled.
