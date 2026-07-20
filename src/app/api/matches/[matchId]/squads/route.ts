import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { requireAuth } from '@/lib/adminAuth';
import { getMatchTimeStatus, getMatchDayIST } from '@/lib/utils';
import { Match, UserSquad, VisibilitySettings } from '@/types';

export const dynamic = 'force-dynamic';

// Powers "Squad Room" (every other user's trio for a match) — any signed-in
// user can call this, not just admins (requireAuth, not requireAdmin).
//
// Runs server-side via the Admin SDK rather than a client Firestore `list`
// query. A single match's squads DO satisfy Firestore's list-query
// provability once matchId+matchDay are both pinned via equality filters —
// but only for matches on a DIFFERENT day than the visibility toggle's
// target date. For a match on the toggle's OWN day, "is this squad visible"
// depends on hasTossPassed(resource.data.matchTimestamp), and matchTimestamp
// isn't (and can't usefully be) pinned by an equality filter — so the rules
// engine can't prove the query is safe, and the whole query is rejected
// even for squads whose toss has already passed. (Confirmed empirically —
// see rules-tests/visibility.rules.test.ts.) This route reimplements the
// exact same policy in code instead, using the real match doc and the
// server's own clock (never a client-supplied value) to decide toss status
// authoritatively.
export async function GET(req: Request, { params }: { params: Promise<{ matchId: string }> }) {
  const authResult = await requireAuth(req);
  if ('error' in authResult) return authResult.error;

  const { matchId } = await params;
  const adminDb = getAdminDb();

  const [matchSnap, visibilitySnap, squadsSnap] = await Promise.all([
    adminDb.collection('matches').doc(matchId).get(),
    adminDb.collection('settings').doc('visibility').get(),
    adminDb.collection('userSquads').where('matchId', '==', matchId).get(),
  ]);

  if (!matchSnap.exists) {
    return NextResponse.json({ error: `Match ${matchId} not found` }, { status: 404 });
  }
  const match = matchSnap.data() as Match;
  const visibility = visibilitySnap.exists ? (visibilitySnap.data() as VisibilitySettings) : null;

  const matchDay = getMatchDayIST(match.date);
  const tossPassed = getMatchTimeStatus(match.date) !== 'open';
  const dayIsHidden = !!visibility?.hideUntilToss && visibility.date === matchDay;

  const squads = squadsSnap.docs
    .map((d) => d.data() as UserSquad)
    .filter((squad) => squad.userId === authResult.uid || tossPassed || !dayIsHidden);

  return NextResponse.json({ squads });
}
