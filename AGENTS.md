# AGENTS.md

**This file is intentionally a pointer, not a second copy of the docs.**

For everything an AI agent (Codex, or any other) needs to work in this
repository — project overview, commands, environment variables, and the
full architecture / standing-decisions notes — read **[`CLAUDE.md`](./CLAUDE.md)**
in the repository root. It is the single source of truth for agent
orientation.

This file used to duplicate `CLAUDE.md` verbatim and then drifted several
updates behind it, at one point contradicting it on a security-relevant
fact (whether the pre-toss squad lock is server-enforced — it is, via
`firestore.rules`). Keeping only a pointer here removes that drift surface.
(AUDIT.md P0-3 / P1-11.)

Other reference docs, also current:

- `README.md` — the detailed reference (file structure, Firestore schemas,
  every feature, known limitations).
- `PROGRESS.md` — reasoning behind standing decisions; read before
  proposing architecture changes.
- `RUNBOOK.md` — plain-English, non-technical maintenance checklist for the
  project owner.
