export const PROJECT_ID = 'gen-lang-client-0759118211';
export const DATABASE_ID = 'ai-studio-b7247bb1-86cb-432e-9975-eaf84ce93c2b';

export const TEST_UID = 'e2e-test-user-1';
export const TEST_UID_2 = 'e2e-test-user-2';
export const TEST_ADMIN_UID = 'e2e-test-admin-1';

export const TEST_MATCH_ID = 'e2e-match-open';
export const TEST_MATCH_LOCKED_ID = 'e2e-match-locked';
// Separate from TEST_MATCH_ID so visibility.spec.ts's squad writes never
// collide with draft.spec.ts's squad for the same seeded test user.
export const TEST_MATCH_VISIBILITY_ID = 'e2e-match-visibility';
// Pre-scored (seeded with totalPoints directly, bypassing the real
// finalize-match API which calls the real RapidAPI — not something E2E
// tests should hit) so leaderboard.spec.ts can exercise the real Firestore
// query + rules + rendering pipeline without a live scorecard fetch.
export const TEST_MATCH_SCORED_ID = 'e2e-match-scored';
export const TEST_USER_SCORE = 50;
export const TEST_USER_2_SCORE = 30;
// A match from several days ago (a DIFFERENT day than any visibility
// toggle set for "today") with a submitted, unscored squad — exercises
// Squad Room's cross-day visibility specifically, separate from the
// scored/leaderboard squads above.
export const TEST_MATCH_PAST_ID = 'e2e-match-past';

export const TEST_PLAYERS = [
  { id: 'e2e-p1', name: 'Test Batter One', team: 'SRH', role: 'BATSMAN', price: 9 },
  { id: 'e2e-p2', name: 'Test Bowler One', team: 'SRH', role: 'BOWLER', price: 8 },
  { id: 'e2e-p3', name: 'Test Allrounder One', team: 'RCB', role: 'ALL_ROUNDER', price: 10 },
  { id: 'e2e-p4', name: 'Test Keeper One', team: 'RCB', role: 'WICKET_KEEPER', price: 9.5 },
];

export const TOKENS_FILE = 'e2e/.tokens.json';

// ── Multi-user simulation fixtures ────────────────────────────────────────
// Everything below powers e2e/multiuser.spec.ts and the multi-user unit /
// rules tests. Kept separate from the single-user fixtures above so existing
// specs are untouched. See e2e/MULTIUSER.md.

export const SIM_USER_COUNT = 10;
export const SIM_TOKENS_FILE = 'e2e/.sim-tokens.json';

// A scored match placed two whole weeks back, so scoring it in the
// multi-user spec never bleeds into any "current week" assertion in the
// other specs. The spec navigates the leaderboard back to this week.
export const SIM_MATCH_SCORED_ID = 'e2e-sim-scored';
export const SIM_MATCH_SCORED_DAYS_AGO = 14;
// A currently-open match for the live concurrent-drafting phase — separate
// from TEST_MATCH_ID so it never collides with draft.spec.ts.
export const SIM_MATCH_OPEN_ID = 'e2e-sim-open';

export interface SimUser {
  n: number;
  uid: string;
  email: string;
  displayName: string;
}

export const SIM_USERS: SimUser[] = Array.from({ length: SIM_USER_COUNT }, (_, i) => {
  const n = i + 1;
  return {
    n,
    uid: `e2e-sim-user-${n}`,
    email: `e2e-sim-${n}@example.com`,
    displayName: `Sim Friend ${n}`,
  };
});

// 16 players per team. Full names are "SRH Alpha".."SRH Papa": the scorecard
// fixture references these exact strings so scoring.ts's full-name match
// resolves them (the surname alone, e.g. "Alpha", collides across the two
// teams — which correctly disables the surname fallback, exactly the real
// ambiguity the fallback is designed to avoid).
export const SIM_ROSTER_LETTERS = [
  'Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel',
  'India', 'Juliet', 'Kilo', 'Lima', 'Mike', 'November', 'Oscar', 'Papa',
] as const;

const SIM_ROLES = ['BATSMAN', 'BOWLER', 'ALL_ROUNDER', 'WICKET_KEEPER'];

export interface SimPlayer {
  id: string;
  name: string;
  team: 'SRH' | 'RCB';
  role: string;
  price: number;
}

export const SIM_ROSTER: SimPlayer[] = (['SRH', 'RCB'] as const).flatMap((team) =>
  SIM_ROSTER_LETTERS.map((letter, i) => ({
    id: `e2e-sim-${team.toLowerCase()}-${letter.toLowerCase()}`,
    name: `${team} ${letter}`,
    team,
    role: SIM_ROLES[i % SIM_ROLES.length],
    price: 8 + (i % 4),
  }))
);

export function simPlayer(team: 'SRH' | 'RCB', letterIndex: number): SimPlayer {
  return SIM_ROSTER.find((p) => p.id === `e2e-sim-${team.toLowerCase()}-${SIM_ROSTER_LETTERS[letterIndex].toLowerCase()}`)!;
}

// Deterministic trio for sim user N (1-based): SRH[n-1], RCB[n-1], SRH[n],
// MVP = SRH[n-1]. User 10 deliberately mirrors user 9 to force a points
// tie for the leaderboard tie-break assertions.
export function simTrio(n: number): { players: string[]; mvpId: string } {
  const idx = n === 10 ? 8 : n - 1;
  const a = simPlayer('SRH', idx);
  const b = simPlayer('RCB', idx);
  const c = simPlayer('SRH', idx + 1);
  return { players: [a.id, b.id, c.id], mvpId: a.id };
}
