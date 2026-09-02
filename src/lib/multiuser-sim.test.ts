import { describe, it, expect } from 'vitest';
import {
  buildPlayerNameLookup,
  parseScorecard,
  calculatePlayerPoints,
  calculateSquadScore,
  validateScorecardResponse,
} from './scoring';
import { computeStandings } from './leaderboard';
import type { UserSquad } from '@/types';
import { SIM_ROSTER, SIM_USERS, simTrio } from '../../e2e/testData';
import { buildSimScorecard } from '../../e2e/simScorecard';

// Tier-1 of the multi-user test standard (e2e/MULTIUSER.md): runs the exact
// synthetic scorecard the E2E spec finalizes through the real scoring engine
// + leaderboard, so the 10-friend maths is verified with zero infrastructure.
// If this drifts, the E2E leaderboard assertions would too.

function scoreEveryone() {
  const lookup = buildPlayerNameLookup(SIM_ROSTER.map((p) => ({ id: p.id, name: p.name })));
  // Also proves the fixture passes the strict scorecard schema (AUDIT.md P0-2).
  const scorecard = validateScorecardResponse(buildSimScorecard());
  const { stats, unmatched } = parseScorecard(scorecard, lookup);

  const playerPoints = new Map<string, number>();
  for (const p of SIM_ROSTER) {
    const s = stats.get(p.id);
    if (s) playerPoints.set(p.id, calculatePlayerPoints(s, false));
  }

  const squads: UserSquad[] = SIM_USERS.map((u) => {
    const { players, mvpId } = simTrio(u.n);
    return {
      userId: u.uid,
      matchId: 'sim',
      players,
      mvpId,
      createdAt: 0,
      matchTimestamp: '2026-04-01T14:00:00.000Z',
      matchDay: '2026-04-01',
      userDisplayName: u.displayName,
      userPhotoURL: null,
      totalPoints: calculateSquadScore(players, mvpId, playerPoints),
    };
  });

  return { squads, playerPoints, unmatched };
}

describe('multi-user simulation — scorecard → points → standings', () => {
  it('resolves every scorecard name (incl. the substitute fielder) to a roster player', () => {
    const { unmatched, playerPoints } = scoreEveryone();
    expect(unmatched.batsmen).toEqual([]);
    expect(unmatched.bowlers).toEqual([]);
    expect(unmatched.fielders).toEqual([]); // "c sub (RCB Papa) b ..." must resolve
    expect(playerPoints.get('e2e-sim-rcb-papa')).toBeGreaterThan(0); // the sub got the catch
  });

  it('gives all 10 sim users a positive, distinct-enough score with a forced tie at 9/10', () => {
    const { squads } = scoreEveryone();
    const byUser = Object.fromEntries(squads.map((s) => [s.userId, s.totalPoints!]));

    for (const u of SIM_USERS) expect(byUser[u.uid]).toBeGreaterThan(0);

    // Users 1..8 strictly descending (trio quality decreases with N).
    for (let n = 1; n <= 7; n++) {
      expect(byUser[`e2e-sim-user-${n}`]).toBeGreaterThan(byUser[`e2e-sim-user-${n + 1}`]);
    }
    // User 10's trio mirrors user 9's -> exact tie.
    expect(byUser['e2e-sim-user-10']).toBe(byUser['e2e-sim-user-9']);
  });

  it('produces a clean 10-row leaderboard: user 1 first, 9 and 10 share a rank', () => {
    const { squads } = scoreEveryone();
    const standings = computeStandings(squads);

    expect(standings).toHaveLength(10);
    expect(standings[0].userId).toBe('e2e-sim-user-1');
    expect(standings[0].rank).toBe(1);
    expect(new Set(standings.map((s) => s.rank)).size).toBeLessThan(10); // a tie exists

    const u9 = standings.find((s) => s.userId === 'e2e-sim-user-9')!;
    const u10 = standings.find((s) => s.userId === 'e2e-sim-user-10')!;
    expect(u9.points).toBe(u10.points);
    expect(u9.rank).toBe(u10.rank);
  });
});
