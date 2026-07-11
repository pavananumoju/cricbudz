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

## AI recommendations: removed

The Gemini-powered "AI Assist" trio suggestion feature (`/api/recommend`)
was removed 2026-07-09 — not needed for how this app is actually used by the
friend group. The dependency (`@google/generative-ai`) was uninstalled.
