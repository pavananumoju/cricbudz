import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { requireAuth } from '@/lib/adminAuth';
import { UserSquad } from '@/types';

export const dynamic = 'force-dynamic';

// Any signed-in user can read the leaderboard — this is NOT admin-gated,
// just authenticated (requireAuth, not requireAdmin).
//
// Runs server-side via the Admin SDK rather than a client Firestore query
// because the leaderboard needs a matchDay RANGE query (>= startDay, <=
// endDay), and Firestore's rules engine can't prove the submission-
// visibility-toggle rule for a range filter the way it can for an equality
// filter (see firestore.rules / rules-tests/) — a client-side version of
// this query is rejected outright on any day the toggle is on.
//
// The Admin SDK bypasses Firestore rules entirely, so the equivalent
// visibility policy is applied here in code instead: only squads with
// totalPoints are returned. A squad only gets totalPoints once an admin
// finalizes its match, which only ever happens after that match is
// complete — always well past toss, and therefore already something
// everyone is allowed to see under the real rule. "Has totalPoints" is
// exactly the set of squads the toggle was never meant to hide.
export async function GET(req: Request) {
  const authResult = await requireAuth(req);
  if ('error' in authResult) return authResult.error;

  const { searchParams } = new URL(req.url);
  const startDay = searchParams.get('startDay');
  const endDay = searchParams.get('endDay');
  if (!startDay || !endDay) {
    return NextResponse.json({ error: 'startDay and endDay query params are required' }, { status: 400 });
  }

  const snap = await getAdminDb()
    .collection('userSquads')
    .where('matchDay', '>=', startDay)
    .where('matchDay', '<=', endDay)
    .get();

  const squads = snap.docs
    .map((d) => d.data() as UserSquad)
    .filter((squad) => squad.totalPoints !== undefined);

  return NextResponse.json({ squads });
}
