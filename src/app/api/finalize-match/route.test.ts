// @vitest-environment node
//
// AUDIT.md P2-17: proves the route's own try/catch actually turns a
// schema-validation failure into HTTP 502 with the field-naming message —
// the deliberate "refuse to compute rather than risk wrong points" contract
// from CLAUDE.md. scoring.test.ts covers the schema; nothing covered the
// route layer that translates it.
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockRequireAdmin = vi.fn();
const mockGetAdminDb = vi.fn();
const mockGetMatchScorecard = vi.fn();

vi.mock('@/lib/adminAuth', () => ({
  requireAdmin: (req: Request) => mockRequireAdmin(req),
  requireAuth: vi.fn(),
}));
vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: () => mockGetAdminDb(),
  getAdminAuth: vi.fn(),
}));
vi.mock('@/lib/rapidapi', () => ({
  getMatchScorecard: (id: string) => mockGetMatchScorecard(id),
}));

import { POST } from './route';

const matchDoc = { exists: true, data: () => ({ team1: 'MI', team2: 'CSK' }), ref: {} };

function dbWithMatch() {
  return {
    collection() {
      return { doc: () => ({ get: async () => matchDoc }) };
    },
  };
}

const request = () =>
  new Request('http://test/api/finalize-match', {
    method: 'POST',
    headers: { authorization: 'Bearer tok', 'content-type': 'application/json' },
    body: JSON.stringify({ matchId: 'm1' }),
  });

beforeEach(() => {
  mockRequireAdmin.mockReset();
  mockGetAdminDb.mockReset();
  mockGetMatchScorecard.mockReset();
  mockRequireAdmin.mockResolvedValue({ uid: 'admin1' });
  mockGetAdminDb.mockReturnValue(dbWithMatch());
});

describe('POST /api/finalize-match — fail-loud on a bad scorecard shape', () => {
  it('returns 502 (not a silent 0-score) when the scorecard is a totally different shape', async () => {
    mockGetMatchScorecard.mockResolvedValue({ someUnrelatedApiChange: true });
    const res = await POST(request());
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toMatch(/no longer matches the shape/i);
  });

  it('returns 502 naming the field when a batsman row drops `runs`', async () => {
    mockGetMatchScorecard.mockResolvedValue({
      ismatchcomplete: true,
      scorecard: [{ batsman: [{ name: 'Rohit Sharma' /* no runs */ }] }],
    });
    const res = await POST(request());
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toMatch(/scorecard\.0\.batsman\.0\.runs/);
  });
});
