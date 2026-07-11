import { describe, it, expect } from 'vitest';
import { getWeekRange, shiftWeek, computeStandings } from './leaderboard';
import { UserSquad } from '@/types';

function mkSquad(overrides: Partial<UserSquad>): UserSquad {
  return {
    userId: 'u1',
    matchId: 'm1',
    players: ['p1', 'p2', 'p3'],
    mvpId: 'p1',
    createdAt: Date.now(),
    matchTimestamp: '2026-04-15T14:00:00.000Z',
    matchDay: '2026-04-15',
    userDisplayName: 'Test User',
    userPhotoURL: null,
    ...overrides,
  };
}

describe('getWeekRange', () => {
  it('resolves a Wednesday to the Monday-Sunday week containing it', () => {
    // 2026-04-15 is a Wednesday.
    const range = getWeekRange(new Date('2026-04-15T10:00:00'));
    expect(range.startDay).toBe('2026-04-13'); // Monday
    expect(range.endDay).toBe('2026-04-19'); // Sunday
  });

  it('resolves a Monday to itself as the week start', () => {
    const range = getWeekRange(new Date('2026-04-13T00:00:01'));
    expect(range.startDay).toBe('2026-04-13');
    expect(range.endDay).toBe('2026-04-19');
  });

  it('resolves a Sunday to the end of its own week, not the next week', () => {
    const range = getWeekRange(new Date('2026-04-19T23:00:00'));
    expect(range.startDay).toBe('2026-04-13');
    expect(range.endDay).toBe('2026-04-19');
  });

  it('handles a week that crosses a month boundary', () => {
    // 2026-04-30 is a Thursday; that week is Apr 27 - May 3.
    const range = getWeekRange(new Date('2026-04-30T12:00:00'));
    expect(range.startDay).toBe('2026-04-27');
    expect(range.endDay).toBe('2026-05-03');
  });
});

describe('shiftWeek', () => {
  it('moves forward one week', () => {
    const current = getWeekRange(new Date('2026-04-15T10:00:00'));
    const next = shiftWeek(current, 1);
    expect(next.startDay).toBe('2026-04-20');
    expect(next.endDay).toBe('2026-04-26');
  });

  it('moves back one week', () => {
    const current = getWeekRange(new Date('2026-04-15T10:00:00'));
    const prev = shiftWeek(current, -1);
    expect(prev.startDay).toBe('2026-04-06');
    expect(prev.endDay).toBe('2026-04-12');
  });
});

describe('computeStandings', () => {
  it('sums points per user across multiple scored matches', () => {
    const squads = [
      mkSquad({ userId: 'u1', matchId: 'm1', totalPoints: 40 }),
      mkSquad({ userId: 'u1', matchId: 'm2', totalPoints: 25 }),
      mkSquad({ userId: 'u2', matchId: 'm1', totalPoints: 50 }),
    ];
    const standings = computeStandings(squads);
    const u1 = standings.find((s) => s.userId === 'u1')!;
    expect(u1.points).toBe(65);
    expect(u1.matchesScored).toBe(2);
  });

  it('excludes squads that have not been scored yet (no totalPoints)', () => {
    const squads = [
      mkSquad({ userId: 'u1', totalPoints: 40 }),
      mkSquad({ userId: 'u2', totalPoints: undefined }),
    ];
    const standings = computeStandings(squads);
    expect(standings.find((s) => s.userId === 'u2')).toBeUndefined();
    expect(standings).toHaveLength(1);
  });

  it('sorts descending and assigns rank 1 to the highest scorer', () => {
    const squads = [
      mkSquad({ userId: 'low', totalPoints: 10 }),
      mkSquad({ userId: 'high', totalPoints: 90 }),
      mkSquad({ userId: 'mid', totalPoints: 50 }),
    ];
    const standings = computeStandings(squads);
    expect(standings.map((s) => s.userId)).toEqual(['high', 'mid', 'low']);
    expect(standings[0].rank).toBe(1);
    expect(standings[1].rank).toBe(2);
    expect(standings[2].rank).toBe(3);
  });

  it('returns an empty array when nothing has been scored', () => {
    expect(computeStandings([])).toEqual([]);
  });
});
