# Context Manifest — CricBudz (IPL Fantasy Arena)

Full detail: see `PROJECT_PROFILE.md` in this same folder.

## What it is
Private, invite-only fantasy cricket web app for the IPL. Users draft a
3-player "trio" (from both playing teams) per match, tag one as MVP (2x
points), and compete on a live-computed Monday–Sunday leaderboard. Not a
public product — SEO/scale/multi-tenant concerns are explicitly out of
scope by design decision.

## Tech stack
- **Framework:** Next.js 15.5 (App Router), React 18.3, TypeScript (strict).
- **Styling:** Tailwind CSS v4 (CSS-first `@theme`, no config file), `clsx`
  + `tailwind-merge` via a `cn()` helper, `lucide-react` icons, `sonner`
  toasts, `motion` for animation.
- **Backend:** Firebase only — Auth (Google sign-in) + Firestore (named DB,
  not `(default)`). Client SDK (`firebase`) for reads/user writes; Admin
  SDK (`firebase-admin`) for server-only admin API routes. No SQL/ORM.
- **External data:** RapidAPI's Cricbuzz-Cricket endpoint (fixtures,
  squads, scorecards) — the only sports-data source.
- **Validation:** Zod v4 validates the Cricbuzz scorecard shape before
  scoring trusts it.
- **Testing:** Vitest + RTL (unit/component), Playwright (E2E, vs. real
  Firebase Emulator Suite), `@firebase/rules-unit-testing` (Firestore
  rules tests).
- **Deploy:** Vercel (app), Firebase CLI (Firestore rules/indexes,
  emulators).

## Output surface
**One surface: a responsive, phone-first web app**, installable as a PWA
(manifest + icons present, `display: standalone`) but **no service
worker** — no true offline app-shell caching. No native mobile/desktop
app. The same Next.js app also hosts all backend logic (API routes) — no
separate backend service.

## Architecture in one paragraph
Client React components talk to Firestore directly (client SDK) for reads
and for writing the user's own squad; a handful of Next.js API routes
(`/api/sync`, `/api/finalize-match`, `/api/admin/users`,
`/api/admin/backup` — all admin-gated via `requireAdmin()`;
`/api/leaderboard`, `/api/matches/[id]/squads` — auth-gated via
`requireAuth()`) use the Admin SDK for privileged writes/reads and to
reimplement policy logic Firestore rules can't structurally enforce
(visibility-toggle list queries). `firestore.rules` is default-deny, with
per-collection rules for `userSquads` (owner-write, shape + toss-lock
validated), `settings` (admin-write), `matches`/`players`
(world-read, no client-write — populated only by `/api/sync`). Scoring
(`src/lib/scoring.ts`) is a pure function over a Zod-validated Cricbuzz
scorecard, triggered manually per match by an admin. All "today"/date
logic funnels through one IST-anchored helper (`getMatchDayIST()`) except
one documented UTC exception tied to a Firestore-rules limitation.

## Design tokens (confirmed present in `src/app/globals.css`)
- **Color:** semantic CSS-var tokens with light/dark pairs — primary
  indigo `#4f46e5`/`#818cf8`, accent amber `#f59e0b`/`#fbbf24`, plus
  success/danger/warning + tint variants, background/surface/foreground/
  border/muted. Dark mode via `.dark` class (not just OS preference).
- **Typography:** Inter (body/sans), Space Grotesk (display/headings,
  uppercase+black on buttons), JetBrains Mono (numeric/stat text). Two
  custom font-size floor tokens: `text-meta` = 12px (informational text),
  `text-micro` = 11px (decorative micro-labels) — both registered into
  `tailwind-merge`'s font-size group via a custom `cn()` extension.
- **Shape:** cards `rounded-3xl`; buttons `rounded-2xl`, 3 sizes (36/44/48px
  tall), 4 variants (primary/secondary/ghost/destructive).
- **Component kit:** small hand-rolled set in `src/components/ui/`
  (Badge, Button, Card, ErrorState, Sheet, Skeleton) — no external UI
  framework dependency. No documented spacing scale beyond stock Tailwind.
