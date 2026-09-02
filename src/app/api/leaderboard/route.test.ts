// @vitest-environment node
//
// AUDIT.md P1-12: covers the leaderboard route's in-code visibility policy —
// "only squads that already have totalPoints" (i.e. already finalized, always
// past toss, always something everyone may see).
import { describe, it, expect, vi, beforeEach } from 'vitest';

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

function makeDb(squads: Record<string, unknown>[]) {
  return {
    collection() {
      return {
        where() {
          return this;
        },
        get: async () => ({ docs: squads.map((s) => ({ data: () => s })) }),
      };
    },
  };
}

const request = (qs = 'startDay=2026-04-06&endDay=2026-04-12') =>
  new Request(`http://test/api/leaderboard?${qs}`, { headers: { authorization: 'Bearer tok' } });

beforeEach(() => {
  mockRequireAuth.mockReset();
  mockGetAdminDb.mockReset();
  mockRequireAuth.mockResolvedValue({ uid: 'u1' });
});

describe('GET /api/leaderboard', () => {
  it('401s when unauthenticated', async () => {
    const { NextResponse } = await import('next/server');
    mockRequireAuth.mockResolvedValue({ error: NextResponse.json({ error: 'no' }, { status: 401 }) });
    expect((await GET(request())).status).toBe(401);
  });

  it('400s when startDay/endDay are missing', async () => {
    mockGetAdminDb.mockReturnValue(makeDb([]));
    expect((await GET(request(''))).status).toBe(400);
  });

  it('returns only squads that already have totalPoints (drops un-finalized ones)', async () => {
    mockGetAdminDb.mockReturnValue(
      makeDb([
        { userId: 'a', totalPoints: 42 },
        { userId: 'b' }, // not finalized -> must be excluded
        { userId: 'c', totalPoints: 0 }, // 0 is a real score, keep it
      ])
    );
    const body = await (await GET(request())).json();
    expect(body.squads.map((s: { userId: string }) => s.userId).sort()).toEqual(['a', 'c']);
  });
});
