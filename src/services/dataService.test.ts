import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getWeekNumber, getWeekRange } from '@/lib/leaderboard';
import { CRICKET_CONFIG } from '@/config/cricket';

// Minimal in-memory fake of the firebase/firestore query surface dataService
// actually uses (collection/where/orderBy/limit/getDocs), so these tests
// exercise the real query-construction code in dataService.ts rather than
// re-testing Firestore itself. Old-season matches use a different seriesId
// than CRICKET_CONFIG.IPL_SERIES_ID to simulate a prior IPL season still
// sitting in the database.
type FakeDoc = { id: string; data: Record<string, any> };
let FAKE_MATCHES: FakeDoc[] = [];

vi.mock('@/lib/firebase', () => ({
  db: {},
  auth: { currentUser: null },
}));

vi.mock('firebase/firestore', () => ({
  collection: (_db: any, name: string) => ({ __col: name }),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: (colRef: any, ...constraints: any[]) => ({ __col: colRef.__col, constraints }),
  where: (field: string, _op: string, value: any) => ({ type: 'where', field, value }),
  orderBy: (field: string, direction: 'asc' | 'desc' = 'asc') => ({ type: 'orderBy', field, direction }),
  limit: (n: number) => ({ type: 'limit', n }),
  Timestamp: {},
  getDocs: (q: any) => {
    let docs = q.__col === 'matches' ? [...FAKE_MATCHES] : [];
    for (const c of q.constraints || []) {
      if (c.type === 'where') docs = docs.filter((d) => d.data[c.field] === c.value);
    }
    const orderC = (q.constraints || []).find((c: any) => c.type === 'orderBy');
    if (orderC) {
      docs.sort((a, b) => {
        const cmp = a.data[orderC.field] > b.data[orderC.field] ? 1 : -1;
        return orderC.direction === 'desc' ? -cmp : cmp;
      });
    }
    const limitC = (q.constraints || []).find((c: any) => c.type === 'limit');
    if (limitC) docs = docs.slice(0, limitC.n);
    return Promise.resolve({
      empty: docs.length === 0,
      docs: docs.map((d) => ({ id: d.id, data: () => d.data })),
    });
  },
}));

const OLD_SERIES_ID = '1111'; // a past IPL season, still in the DB

beforeEach(() => {
  FAKE_MATCHES = [
    // Old season: Jan-Feb 2025
    { id: 'old-1', data: { id: 'old-1', seriesId: OLD_SERIES_ID, date: '2025-01-10T14:00:00.000Z' } },
    { id: 'old-2', data: { id: 'old-2', seriesId: OLD_SERIES_ID, date: '2025-02-20T14:00:00.000Z' } },
    // Current season, starting mid-week on 2026-04-15 (a Wednesday)
    { id: 'new-1', data: { id: 'new-1', seriesId: CRICKET_CONFIG.IPL_SERIES_ID, date: '2026-04-15T14:00:00.000Z' } },
    { id: 'new-2', data: { id: 'new-2', seriesId: CRICKET_CONFIG.IPL_SERIES_ID, date: '2026-04-22T14:00:00.000Z' } },
  ];
});

describe('getMatches (season-scoped)', () => {
  it('excludes matches from a prior season', async () => {
    const { getMatches } = await import('./dataService');
    const matches = await getMatches();
    expect(matches.map((m) => m.id)).toEqual(['new-1', 'new-2']);
  });
});

describe('getEarliestMatchDate (season-scoped)', () => {
  it('returns the current season\'s earliest match, not an older season\'s', async () => {
    const { getEarliestMatchDate } = await import('./dataService');
    const earliest = await getEarliestMatchDate();
    expect(earliest).toBe('2026-04-15T14:00:00.000Z');
  });

  it('feeds getWeekNumber correctly: the current season\'s first match week is Week 1', async () => {
    const { getEarliestMatchDate } = await import('./dataService');
    const earliest = await getEarliestMatchDate();
    const seasonStart = new Date(earliest!);

    const firstWeek = getWeekRange(new Date('2026-04-15T14:00:00.000Z'));
    expect(getWeekNumber(firstWeek.start, seasonStart)).toBe(1);

    const secondWeek = getWeekRange(new Date('2026-04-22T14:00:00.000Z'));
    expect(getWeekNumber(secondWeek.start, seasonStart)).toBe(2);
  });
});
