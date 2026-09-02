import { describe, it, expect } from 'vitest';
import { getWeekRange, shiftWeek, formatWeekLabel, computeStandings, getWeekNumber } from './leaderboard';
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

  it('assigns a late-Sunday-UTC match to the following IST week (Monday), not the UTC week', () => {
    // 19:00 UTC Sunday Apr 19 = 00:30 IST Monday Apr 20 — the exact
    // "traveler abroad" divergence item #8 flags: a UTC-based week
    // calculation would put this match in the Apr 13-19 week instead.
    const range = getWeekRange(new Date('2026-04-19T19:00:00.000Z'));
    expect(range.startDay).toBe('2026-04-20');
    expect(range.endDay).toBe('2026-04-26');
  });

  it('computes the same IST week regardless of the machine/browser local timezone', () => {
    const original = process.env.TZ;
    try {
      process.env.TZ = 'America/Los_Angeles';
      const range = getWeekRange(new Date('2026-04-19T19:00:00.000Z'));
      expect(range.startDay).toBe('2026-04-20');
      expect(range.endDay).toBe('2026-04-26');
    } finally {
      process.env.TZ = original;
    }
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

describe('formatWeekLabel', () => {
  it('labels the IST week boundaries regardless of the machine local timezone', () => {
    const original = process.env.TZ;
    try {
      process.env.TZ = 'America/Los_Angeles';
      const range = getWeekRange(new Date('2026-04-15T10:00:00.000Z'));
      expect(formatWeekLabel(range)).toBe('Apr 13 – Apr 19, 2026');
    } finally {
      process.env.TZ = original;
    }
  });
});

describe('getWeekNumber', () => {
  it('labels the season-opener week as Week 1', () => {
    // Season opener is a Saturday; its week is Week 1 regardless of which
    // day within that week `seasonStart` itself falls on.
    const seasonStart = new Date('2026-03-28T14:00:00'); // Saturday
    const week1 = getWeekRange(seasonStart);
    expect(getWeekNumber(week1.start, seasonStart)).toBe(1);
  });

  it('increments by exactly 1 for each subsequent week', () => {
    const seasonStart = new Date('2026-03-28T14:00:00');
    const week2 = shiftWeek(getWeekRange(seasonStart), 1);
    const week8 = shiftWeek(getWeekRange(seasonStart), 7);
    expect(getWeekNumber(week2.start, seasonStart)).toBe(2);
    expect(getWeekNumber(week8.start, seasonStart)).toBe(8);
  });

  it('matches the real May 11-17 week against the real March 28 season opener', () => {
    // The exact scenario reported: season opener 2026-03-28, and the week
    // of May 11-17 should read as a specific, correct week number.
    const seasonStart = new Date('2026-03-28T14:00:00');
    const may11Week = getWeekRange(new Date('2026-05-15T14:00:00'));
    expect(getWeekNumber(may11Week.start, seasonStart)).toBe(8);
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

// ── Multi-user scenarios (10 friends, one week) ───────────────────────────
// Tier-1 of the multi-user test standard (see e2e/MULTIUSER.md): pure-
// function coverage of the leaderboard maths at friend-group scale —
// ranking, ties, partial weeks — no browser or emulator needed.
describe('computeStandings — 10-user week', () => {
  const WEEK_DAY = '2026-04-15'; // a Wednesday

  function weekSquads(pointsByUser: Record<string, number | undefined>, matchDay = WEEK_DAY): UserSquad[] {
    return Object.entries(pointsByUser).map(([userId, totalPoints]) =>
      mkSquad({ userId, matchId: `m-${userId}`, matchDay, userDisplayName: `Friend ${userId}`, totalPoints })
    );
  }

  it('ranks 10 users by total points with no gaps or duplicates', () => {
    const points = Object.fromEntries(
      Array.from({ length: 10 }, (_, i) => [`u${i + 1}`, (10 - i) * 25]) // u1=250 ... u10=25
    );
    const standings = computeStandings(weekSquads(points));
    expect(standings).toHaveLength(10);
    expect(standings.map((s) => s.userId)).toEqual(['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8', 'u9', 'u10']);
    expect(standings.map((s) => s.rank)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('gives tied users the same rank and skips the next (competition ranking)', () => {
    const standings = computeStandings(
      weekSquads({ a: 100, b: 50, c: 50, d: 50, e: 10 })
    );
    expect(standings.map((s) => [s.userId, s.rank])).toEqual([
      ['a', 1],
      ['b', 2],
      ['c', 2],
      ['d', 2],
      ['e', 5],
    ]);
  });

  it('breaks ties deterministically by display name then userId (stable across runs)', () => {
    const first = computeStandings(weekSquads({ zoe: 50, amy: 50, bob: 50 })).map((s) => s.userId);
    const again = computeStandings(weekSquads({ bob: 50, zoe: 50, amy: 50 })).map((s) => s.userId);
    expect(first).toEqual(again);
    // displayName is `Friend ${userId}` -> "Friend amy" < "Friend bob" < "Friend zoe"
    expect(first).toEqual(['amy', 'bob', 'zoe']);
  });

  it('is a partial week: unsubmitted / unscored friends are absent, not zero-ranked', () => {
    const standings = computeStandings(
      weekSquads({ submitted1: 40, submitted2: 20, notScoredYet: undefined })
    );
    expect(standings.map((s) => s.userId)).toEqual(['submitted1', 'submitted2']);
    expect(standings.find((s) => s.userId === 'notScoredYet')).toBeUndefined();
  });

  it('sums each user across the whole Monday–Sunday week', () => {
    const range = getWeekRange(new Date(`${WEEK_DAY}T10:00:00`));
    const inWeek = [
      mkSquad({ userId: 'u1', matchId: 'mon', matchDay: range.startDay, userDisplayName: 'Friend u1', totalPoints: 30 }),
      mkSquad({ userId: 'u1', matchId: 'sun', matchDay: range.endDay, userDisplayName: 'Friend u1', totalPoints: 45 }),
      mkSquad({ userId: 'u2', matchId: 'wed', matchDay: WEEK_DAY, userDisplayName: 'Friend u2', totalPoints: 60 }),
    ];
    const standings = computeStandings(inWeek);
    expect(standings.find((s) => s.userId === 'u1')!.points).toBe(75);
    expect(standings.find((s) => s.userId === 'u1')!.matchesScored).toBe(2);
    expect(standings[0].userId).toBe('u1'); // 75 > 60
  });
});
