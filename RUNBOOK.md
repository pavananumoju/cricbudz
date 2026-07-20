# Maintenance Runbook

This is a plain-English checklist for looking after CricBudz between IPL
seasons, or any time you come back to this project after a break and aren't
sure where to start.

**You do not need to understand the code to use this file.** Every section
below is written so you can either (a) follow the steps yourself by copying
commands into a terminal, or (b) copy the *entire section* — heading and
all — and paste it to an AI coding assistant (like Claude Code) with the
instruction "do this." The assistant has everything it needs in the section
itself.

If you're using an AI assistant, the single easiest thing to do is open a
terminal in this project folder and say: **"Read RUNBOOK.md and run through
the Regular Health Check section, fix anything that's broken, and tell me
in plain English what you found."**

---

## 0. Orientation — "I haven't touched this in months, where do I start?"

1. Open a terminal and go to the project folder.
2. Run `git status` and `git log --oneline -20` to see what's changed
   recently and whether you have uncommitted work sitting around.
3. Read `PROGRESS.md` — it's a running log of *why* things are built the
   way they are, so you (or an AI) don't accidentally undo a deliberate
   decision.
4. Read `CLAUDE.md` — a technical map of the codebase (what talks to what).
   You don't need to understand all of it; an AI assistant reads this
   automatically and uses it to orient itself.
5. Come back to this file (`RUNBOOK.md`) and run the **Regular Health
   Check** below.

---

## 1. Regular Health Check (run this before each new IPL season, or any
   time you're not sure the app still works)

Run these in order. Each one takes a minute or two. If any step fails,
copy the error output and hand it to an AI assistant along with "this
step in RUNBOOK.md failed, please fix it."

### 1a. Does the code still compile?

```bash
npx tsc --noEmit
```

**What good looks like:** no output at all (silence = success).
**If it fails:** it'll print a list of type errors with file names and
line numbers. This usually means a dependency upgraded and changed its
types slightly — safe for an AI to fix.

### 1b. Does the linter pass?

```bash
npm run lint
```

**What good looks like:** `✔ No ESLint warnings or errors`.

### 1c. Do the automated tests pass?

```bash
npx vitest run
```

**What good looks like:** a line like `Tests  69 passed (69)` with no
failures. These tests check the fantasy-points scoring math specifically
— if they fail, **do not finalize any real matches** until they're fixed,
since it means a score could come out wrong.

### 1d. Does the app actually build for production?

```bash
npm run build
```

**What good looks like:** ends with a summary of routes/pages and no red
"Error" text. This is the same build Vercel runs when you deploy — if
this fails locally, deploying would also fail.

### 1e. Does RapidAPI (the cricket data source) still respond correctly?

This is the piece most likely to break on its own — Cricbuzz (the data
provider behind RapidAPI) can change their response format without
warning, since we don't control it.

1. Start the app locally: `npm run dev`
2. Sign in as your admin account.
3. Go to the Dashboard and click **"Sync Fixtures"**.
4. What good looks like: a green success toast ("Synced N matches"). If
   Cricbuzz changed something about how they list *players* for a team
   specifically, you'll see a separate **orange warning toast** naming
   which teams had no players synced — that's the app deliberately
   flagging it instead of silently pretending everything's fine.
5. Once IPL season is live and you finalize a real match's score
   (Admin → the match page → "Finalize Match"), if Cricbuzz has changed
   the *scorecard* format, the app will refuse to calculate scores and
   show a red error explaining exactly which field it couldn't find —
   instead of quietly saving wrong points. If you ever see that error,
   it means RapidAPI's response shape changed and the code that reads it
   (`src/lib/scoring.ts`, the `ScorecardResponseSchema` near the top)
   needs to be updated to match the new shape — a good task to hand to an
   AI assistant along with the exact error message.

### 1f. Are dependencies (npm packages) badly out of date?

```bash
npm outdated
```

This lists every package with its current version vs. the latest
available. **You do not need to update everything** — most of these are
fine to leave alone for a long time. Only pay attention to:

- Anything with **"Next.js"**, **"React"**, or **"firebase"** in the name
  that's more than a couple of major versions behind — these are the ones
  most likely to eventually stop being supported (security patches).
- Run `npm audit` too — this specifically flags known **security**
  vulnerabilities (separate from "just an old version"). If it reports
  anything "high" or "critical," that's worth fixing sooner rather than
  later; hand the output to an AI assistant and ask it to fix just those.

**How to upgrade safely:** don't do it yourself manually. Tell an AI
assistant: "Upgrade [package name] to the latest version, then run the
Regular Health Check in RUNBOOK.md and fix anything that breaks." Upgrade
one thing (or one small group of related things) at a time, not
everything at once — that way if something breaks, it's obvious what
caused it.

---

## 2. Season Rollover Checklist (do this once, right before a new IPL
   season starts)

1. **Take a backup first.** Sign in as admin, go to `/admin`, and click
   **"Download Backup"** (see Section 3 below). Do this *before* touching
   `IPL_SERIES_ID` — it's your safety copy of the just-finished season's
   data in case anything goes wrong during rollover.
2. Open `src/config/cricket.ts` and update `IPL_SERIES_ID` and
   `IPL_SEASON` to the new season's values. (An AI assistant can look
   these up if you tell it the current IPL season's Cricbuzz series ID —
   you may need to find that ID via RapidAPI's Cricbuzz endpoint
   documentation or by browsing Cricbuzz's site for the series URL, since
   it's not something the app can guess on its own.)
3. Run the **Regular Health Check** above, start to finish.
4. Deploy (see Section 4 below).
5. Sign in as admin and click **Sync Fixtures** on the dashboard once the
   new season's matches are listed on Cricbuzz — this pulls the new
   fixtures and player rosters into the app.
6. Spot check: open a couple of matches and confirm both teams' players
   show up correctly with real names (not blank/garbled).
7. **Verify the leaderboard reads "Week 1".** Go to `/leaderboard` — the
   header should say "Week 1", not some larger number. Matches and
   leaderboard weeks are scoped to the current `IPL_SERIES_ID`, so old
   seasons' fixtures never leak into the new one's match list or week
   count; if it says anything other than "Week 1" right after the first
   sync, something's wrong with the rollover — hand this to an AI
   assistant with "the leaderboard didn't reset to Week 1 after season
   rollover."

---

## 3. Data Safety (backups)

- **Anytime you want a safety copy of all app data:** sign in as admin,
  go to `/admin`, and click **"Download Backup"**. This downloads a JSON
  file with everything (matches, players, squads, settings). It's
  read-only and safe to click anytime — it doesn't change anything in the
  app.
- **Recommended habit:** download a backup right before the season starts
  and again right after it ends, and keep the file somewhere safe (e.g.
  a cloud drive). It's a small file — trivial to keep a handful of these
  around going back years.
- **Restoring a backup is deliberately NOT a button in the app** — that's
  on purpose, so a database can never be overwritten by a misclick. If
  you ever actually need to restore (e.g. the database got wiped), tell
  an AI assistant: "Restore the Firestore backup at [file path] using
  scripts/restore-firestore.mjs" — it will run it in dry-run mode first
  (prints what it *would* do, changes nothing) and only overwrite real
  data with an explicit `--confirm` flag, run on purpose.

---

## 4. Deploying a change

Once the Regular Health Check (Section 1) passes cleanly:

```bash
git add -A
git commit -m "describe what changed"
git push
```

If deployment is wired to Vercel via GitHub, pushing to the main branch
deploys automatically — check the Vercel dashboard for the deployment
status. If deploying manually instead, ask an AI assistant to run
`vercel --prod` for you and confirm the production URL still loads
afterward.

---

## 5. Managing who has admin access

Go to `/admin` → **"Registered Users"**. This lists everyone who has ever
signed in, with a **Grant Admin** / **Revoke Admin** button next to each.
Admins can: trigger fixture syncs, finalize match scores, set
Man-of-the-Match, and manage other users' admin access (except revoking
their own — that's blocked on purpose so you can't accidentally lock
yourself out).

---

## 6. When something feels broken and you don't know why

Give an AI assistant this exact prompt, filled in:

> "Something's wrong with CricBudz: [describe what you're seeing, e.g.
> 'the leaderboard shows nothing' or 'I can't sign in']. Please read
> CLAUDE.md and PROGRESS.md for context, investigate, and explain what's
> wrong in plain English before fixing anything."

Asking it to explain before fixing gives you a chance to sanity-check
that it understood the problem correctly, especially after a long time
away from the project.
