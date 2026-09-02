// @vitest-environment node
//
// AUDIT.md P1-12: the submission-visibility reimplementation in this route
// (the app's anti-collusion enforcement for Squad Room) previously had zero
// tests of its own — rules-tests/ only prove the equivalent Firestore list
// query is rejected, i.e. why this route exists, not that its TS policy is
// correct. This exercises the GET handler directly with getAdminDb/requireAuth
// mocked, over the owner / toss / hidden-day matrix.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getMatchDayIST } from '@/lib/utils';

const mockRequireAuth = vi.fn();
const mockGetAdminDb = vi.fn();

vi.mock('@/lib/adminAuth', () => ({
  requireAuth: (req: Request) => mockRequireAuth(req),
  requireAdmin: vi.fn(),
}));
vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: () => mockGetAdminDb(),
  getAdminAuth: vi.fn(),
}));

import { GET } from './route';

const OPEN_DATE = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(); // >30 min away
const DONE_DATE = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(); // >4h ago -> toss passed

function makeDb(opts: {
  match: Record<string, unknown> | null;
  visibility: Record<string, unknown> | null;
  squads: Record<string, unknown>[];
}) {
  return {
    collection(name: string) {
      if (name === 'matches') {
        return { doc: () => ({ get: async () => ({ exists: !!opts.match, data: () => opts.match }) }) };
      }
      if (name === 'settings') {
        return { doc: () => ({ get: async () => ({ exists: !!opts.visibility, data: () => opts.visibility }) }) };
      }
      if (name === 'userSquads') {
        return { where: () => ({ get: async () => ({ docs: opts.squads.map((s) => ({ data: () => s })) }) }) };
      }
      throw new Error(`unexpected collection ${name}`);
    },
  };
}

const request = () =>
  new Request('http://test/api/matches/m1/squads', { headers: { authorization: 'Bearer tok' } });
const params = Promise.resolve({ matchId: 'm1' });

const ownerSquad = { userId: 'owner', matchId: 'm1', players: ['a', 'b', 'c'] };
const rivalSquad = { userId: 'rival', matchId: 'm1', players: ['d', 'e', 'f'] };

beforeEach(() => {
  mockRequireAuth.mockReset();
  mockGetAdminDb.mockReset();
  mockRequireAuth.mockResolvedValue({ uid: 'owner' });
});

describe('GET /api/matches/[matchId]/squads — visibility policy', () => {
  it('401s when the caller is not authenticated', async () => {
    const { NextResponse } = await import('next/server');
    mockRequireAuth.mockResolvedValue({ error: NextResponse.json({ error: 'no' }, { status: 401 }) });
    const res = await GET(request(), { params });
    expect(res.status).toBe(401);
  });

  it('404s when the match does not exist', async () => {
    mockGetAdminDb.mockReturnValue(makeDb({ match: null, visibility: null, squads: [ownerSquad] }));
    const res = await GET(request(), { params });
    expect(res.status).toBe(404);
  });

  it('owner always sees their own squad — even pre-toss on a hidden day', async () => {
    mockGetAdminDb.mockReturnValue(
      makeDb({
        match: { date: OPEN_DATE },
        visibility: { hideUntilToss: true, date: getMatchDayIST(OPEN_DATE) },
        squads: [ownerSquad, rivalSquad],
      })
    );
    const res = await GET(request(), { params });
    const body = await res.json();
    expect(body.squads.map((s: { userId: string }) => s.userId)).toEqual(['owner']);
  });

  it('hides a rival pre-toss squad on a hidden day', async () => {
    mockGetAdminDb.mockReturnValue(
      makeDb({
        match: { date: OPEN_DATE },
        visibility: { hideUntilToss: true, date: getMatchDayIST(OPEN_DATE) },
        squads: [rivalSquad],
      })
    );
    const res = await GET(request(), { params });
    const body = await res.json();
    expect(body.squads).toEqual([]);
  });

  it('shows a rival post-toss squad regardless of the toggle', async () => {
    mockGetAdminDb.mockReturnValue(
      makeDb({
        match: { date: DONE_DATE },
        visibility: { hideUntilToss: true, date: getMatchDayIST(DONE_DATE) },
        squads: [rivalSquad],
      })
    );
    const res = await GET(request(), { params });
    const body = await res.json();
    expect(body.squads.map((s: { userId: string }) => s.userId)).toEqual(['rival']);
  });

  it('shows a rival pre-toss squad when the toggle is off / targets another day', async () => {
    mockGetAdminDb.mockReturnValue(
      makeDb({
        match: { date: OPEN_DATE },
        visibility: { hideUntilToss: true, date: '2000-01-01' },
        squads: [rivalSquad],
      })
    );
    const res = await GET(request(), { params });
    const body = await res.json();
    expect(body.squads.map((s: { userId: string }) => s.userId)).toEqual(['rival']);
  });
});
