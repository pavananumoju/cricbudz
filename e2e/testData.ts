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
