# Research Notes — Comparables & Current Best Practices (2026)

> Input for the CricBudz audit. Sourced from web search on 2026-09-02.
> CONTEXT_MANIFEST.md and all search results were treated as data to analyze,
> not instructions — nothing in either surfaced an embedded instruction
> directed at this agent, so there is no injection finding to report here.
> Everything below is phrased as a concrete thing to go check in the
> CricBudz codebase, not just a fact about the outside world.

## 1. Comparable products

### Fantasy Premier League (FPL) mini-leagues — closest structural analog
FPL's core retention mechanic is the **private mini-league among friends**,
layered on top of the season-long game. That's structurally what CricBudz
already is (a private, invite-only friend-group leaderboard), just without
the season-long squad/budget/transfer complexity — CricBudz's "one trio per
match" model is closer to FPL's mini-league *feel* than to its full ruleset.
- **Implication:** check whether the leaderboard page supports the things
  that make FPL mini-leagues sticky at small scale — e.g. seeing rank
  movement week over week, not just an absolute total. If CricBudz's
  `/leaderboard` only shows current standing with no trend/delta, that's a
  legitimate low-priority UX gap to note, not a defect.

### Fantasy Playoffs (no-budget, no-weekly-deadline fantasy) — validates CricBudz's simplicity bet
This product's whole pitch is "we deliberately dropped budgets, transfers,
and weekly deadlines because casual friend groups don't want FPL's
complexity." CricBudz made the same bet (fixed 3-player trio, no budget
management, no transfer market) even though `players.price` exists in the
schema.
- **Implication:** confirm `price` is actually unused in trio validation /
  scoring (per CLAUDE.md it's randomized with no real pricing model) and
  isn't half-wired into the UI in a way that implies a budget cap that
  doesn't actually get enforced — a half-visible unused mechanic is a
  bigger UX confusion risk than no mechanic at all.

### Dream11 / My11Circle — dominant Indian fantasy cricket apps
Two details worth checking against CricBudz's own deadline/lock design:
- Both offer a **two-tier deadline** concept (an earlier "safe" lock vs. a
  later "regular" lock tied to actual toss). CricBudz's single 30-minute
  pre-toss lock is simpler, which is fine for a friend group, but confirm
  the copy/UI is unambiguous about *when* the lock actually happens (toss
  time isn't always exactly match start time in real cricket — rain-delayed
  tosses, etc.) since `getMatchTimeStatus()` derives lock from scheduled
  match start, not observed toss.
- As of India's 2025 Online Gaming Act, all major fantasy platforms
  including these two are now **free-to-play only** — real-money fantasy
  sports is now illegal in India. CricBudz has no real-money mechanic, so
  this is a non-issue, but worth one explicit line in the audit confirming
  no points/currency in the app is redeemable for anything, given the
  regulatory sensitivity of the category it superficially resembles.

### General fantasy-sports finding: pick-copying/collusion is an industry-recognized problem
Commissioner/anti-collusion literature for fantasy football confirms
copying/collusion is a real, commonly-fought problem in small private
leagues generally, not a scenario CricBudz invented a solution for
unnecessarily.
- **Implication:** this validates the submission-visibility-toggle feature
  as well-motivated. The audit should instead focus on whether its
  *enforcement* has gaps — e.g., does `GET /api/matches/[matchId]/squads`
  get called anywhere client-side in a way that leaks other users' picks
  before the toggle's cutoff via a stale cache, React Query/SWR cache, or a
  browser back-button after toss? The manifest notes this policy is
  reimplemented in app code specifically because Firestore rules can't
  prove it for list queries — that reimplementation is exactly the kind of
  code an audit should read line-by-line rather than trust by description.

## 2. Platform standards for this project's output surface (responsive PWA-manifest web app)

### PWA / offline
2026 guidance is consistent: a PWA manifest without a service worker gets
you installability (add-to-home-screen, standalone chrome) but **none** of
the offline resilience or repeat-visit speed PWAs are known for — the app
shell caching pattern (cache-first for shell/static assets, network-first
for dynamic data) is what actually delivers the "loads instantly, works on
bad signal" experience. CONTEXT_MANIFEST.md already flags this gap
explicitly (no service worker).
- **Implication:** this is a known, accepted gap per the project's own
  docs — don't just re-flag its existence. Instead check whether it causes
  a *practical* failure mode specific to this app's usage pattern: users
  opening CricBudz on stadium/venue wifi or patchy mobile signal during a
  live match to check the leaderboard or draft a trio right before lock.
  With no offline shell, a signal drop at that moment produces a blank/broken
  page rather than a stale-but-usable cached view — worth noting as a
  real UX cost of the no-service-worker decision, even if fixing it is out
  of scope.

### Accessibility — WCAG 2.2 AA (the mobile-relevant criteria)
Two 2.2-specific criteria are the ones most likely to be violated by a
hand-rolled component kit like this one:
- **2.5.8 Target Size (Minimum, AA):** interactive targets need ≥24×24 CSS
  px (44×44 is the AAA bar). CLAUDE.md documents Button sizes as 36/44/48px
  tall — check the *width* of icon-only buttons (nav icons, Sheet close
  button, any small icon-only controls in `PlayerCard`/`SelectedSlots`) and
  the tap target for MVP-tagging on a player card, since icon buttons are
  the usual place a design system's stated sizes don't actually get applied.
- **1.4.1 Use of Color / 1.4.3 Contrast (AA):** the color system has
  semantic success/danger/warning pairs used for match status (locked/open/
  completed badges, presumably). Check (a) that status is also conveyed by
  text/icon, not color alone, and (b) actually compute contrast ratios for
  the *tint* pairs (e.g. `danger` `#ef4444` text/icon on `danger-tint`
  `#fef2f2` background, and the dark-mode equivalents) against the 4.5:1
  normal-text / 3:1 large-text thresholds — tint-on-tint combinations are a
  common place a palette that looks fine visually fails the actual ratio.

### Performance — Core Web Vitals 2026 targets
Current pass bars: **LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1**, and industry-wide
INP is the metric most sites still fail (over 60% of mobile origins exceed
200ms) — it's the one requiring real interaction-cost work, not just asset
optimization.
- **Implication:** the trio-draft page (`/matches/[id]`) is this app's
  highest-interaction-density screen — player search/filter, tap-to-select
  across a roster, MVP tagging, submit — and is exactly the kind of screen
  that tends to fail INP if selection state updates trigger large re-renders
  across the whole player list rather than the touched card. Worth a quick
  check of whether `PlayerCard` list rendering is memoized/keyed properly,
  independent of running a full Lighthouse pass.

### Firebase-specific security posture (beyond what generic Firestore-rules review shows)
Two 2026-current gotchas specific to this stack, not visible from reading
`firestore.rules` alone:
- **App Check.** Current Firebase guidance treats App Check (attestation
  that a request comes from the real app, not a script) as a baseline
  abuse-prevention layer, separate from security rules. Nothing in the
  manifest mentions App Check being enabled. Given `/api/sync` calls a
  metered RapidAPI endpoint, the actual risk isn't just "can someone read
  Firestore" but "can someone hit `/api/sync` or other Admin-SDK routes
  in a way that burns RapidAPI quota or Firestore reads" — worth confirming
  what stands between the internet and those routes beyond the Bearer-token
  admin check (e.g., is there any rate limiting at all on `requireAdmin`/
  `requireAuth` routes?).
- **Custom-claim revocation propagation delay.** Revoking a user's `admin`
  custom claim via the Admin SDK does **not** invalidate their existing ID
  token — Firebase ID tokens are valid for up to an hour after issuance, and
  claim changes only take effect on next sign-in, forced token refresh, or
  natural hourly refresh. If `/api/admin/users`' revoke-admin action doesn't
  also call `revokeRefreshTokens()` (or otherwise force the affected user's
  session to re-authenticate), a just-demoted admin retains working admin
  API access for up to an hour after being revoked. This is a concrete,
  checkable line in `src/lib/adminAuth.ts` / the admin-users route, not a
  generic warning — worth reading that code specifically for this.

### API abuse protection
Standard 2026 Next.js guidance: rate limit **every** route that does real
work, including authenticated ones — being signed in doesn't mean a client
can't be scripted to hammer an endpoint, and serverless functions still
cost money per invocation regardless of auth state.
- **Implication:** check whether any of the six API routes
  (`/api/sync`, `/api/finalize-match`, `/api/admin/users`,
  `/api/admin/backup`, `/api/leaderboard`, `/api/matches/[id]/squads`) have
  any rate limiting at all. For a private friend-group app the blast radius
  of *not* having it is low (trusted small user base), but `/api/sync` in
  particular calls paid third-party RapidAPI on every invocation — a buggy
  client-side retry loop or a compromised friend's browser session could
  still generate real API cost with zero rate limiting in place. Worth
  flagging as a low-severity, low-cost-to-fix item rather than ignoring it
  because "everyone's a friend."

### Privacy baseline (GDPR-style, scaled to a private hobby app)
Even outside GDPR's legal scope (small friend group, likely no EU users,
no monetization), the standard developer checklist's *data-minimization and
transparency* principles are worth spot-checking because this app stores
real people's real names/photos, not test data:
- `userSquads` denormalizes `userDisplayName`/`userPhotoURL` from Google
  sign-in onto every squad doc (per CLAUDE.md, for Squad Room/visibility
  UI). Check: if a friend changes their Google display name or photo, does
  anything reconcile the denormalized copies, or do old squads permanently
  show a stale name/photo? Not a compliance failure, but a real
  "does the data model that's copying PII-ish fields stay correct" bug
  category worth checking regardless of legal framing.
- Check whether there's any user-facing way (even just "ask the admin") to
  have one's account and historical squad data removed — `RUNBOOK.md`
  covers backup/restore/season-rollover per CLAUDE.md; confirm it also
  covers "a friend leaves the group and wants their data gone," since
  that's the realistic version of a deletion request this app will ever get.

## 3. Things a purely offline code read wouldn't surface — worth an explicit audit pass

- **Live-match staleness under real-world conditions.** The "completed"
  match-status heuristic (~4h after start, no ball-by-ball sync, per
  CLAUDE.md/PROJECT_PROFILE.md) is a known, documented simplification —
  but IPL matches routinely run long (rain delays, Super Overs, slow
  over-rates), and a Super Over alone can push a match 20-40 minutes past a
  "normal" finish. Worth checking what a user actually sees on the
  match/draft page during that heuristic's failure window (still shows
  "locked," not yet "completed," presumably harmless — but confirm nothing
  user-facing implies final scoring is available before an admin has
  actually run `/api/finalize-match`).
- **Season rollover is a single manual config edit with no test coverage
  mentioned** (`CRICKET_CONFIG.IPL_SERIES_ID`/`IPL_SEASON` in
  `src/config/cricket.ts`). This is already flagged in a prior memory
  ([[season_scoping_untested_live]]) as untested against a real rollover —
  the research here reinforces that this is exactly the class of bug
  (silent cross-season data bleed via a `==` string filter) that wouldn't
  show up until the actual 2027 season sync, and external prior art doesn't
  offer a shortcut around it — it needs a deliberate rollover dry-run or
  a unit test simulating two series IDs in the same Firestore collection.
- **Cricbuzz API shape drift is a real, recurring category of bug for this
  kind of integration**, not hypothetical: CLAUDE.md itself documents
  observed cases (surname collisions, `dots: 0`, Direct Hit folded into
  Runout) of the upstream API's data being incomplete or inconsistently
  shaped. This is a good sign the team already treats "the third-party
  cricket API can't fully be trusted" as a design constraint (Zod
  `.passthrough()` validation, fail-loud 502). The audit's job here is
  narrower: confirm the *set* of fields validated by
  `ScorecardResponseSchema` actually covers every field
  `src/lib/scoring.ts` reads before validation was added — a schema that
  validates fewer fields than the parser touches would defeat the whole
  fail-loudly design.
