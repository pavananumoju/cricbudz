// Seeds the Firebase Emulator Suite with fixed test data before the E2E
// suite runs. NEVER imported by app code — only by playwright's
// global-setup, and only after FIRESTORE_EMULATOR_HOST /
// FIREBASE_AUTH_EMULATOR_HOST are set, which routes every call here to the
// local emulator regardless of what real credentials exist in .env.local.
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { writeFileSync } from 'fs';
import { CRICKET_CONFIG } from '../src/config/cricket';
import {
  PROJECT_ID,
  DATABASE_ID,
  TEST_UID,
  TEST_UID_2,
  TEST_ADMIN_UID,
  TEST_MATCH_ID,
  TEST_MATCH_LOCKED_ID,
  TEST_MATCH_VISIBILITY_ID,
  TEST_MATCH_SCORED_ID,
  TEST_USER_SCORE,
  TEST_USER_2_SCORE,
  TEST_MATCH_PAST_ID,
  TEST_PLAYERS,
  TOKENS_FILE,
} from './testData';

export async function runSeed() {
  const app = getApps().length ? getApps()[0] : initializeApp({ projectId: PROJECT_ID });
  const db = getFirestore(app, DATABASE_ID);
  const auth = getAuth(app);

  for (const col of ['matches', 'players', 'userSquads', 'settings']) {
    const snap = await db.collection(col).get();
    if (!snap.empty) {
      const batch = db.batch();
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }

  const now = Date.now();
  const openMatchDate = new Date(now + 6 * 60 * 60 * 1000).toISOString(); // 6h out — open for drafting
  const lockedMatchDate = new Date(now - 60 * 60 * 1000).toISOString(); // started 1h ago — locked

  await db.collection('matches').doc(TEST_MATCH_ID).set({
    id: TEST_MATCH_ID,
    seriesId: CRICKET_CONFIG.IPL_SERIES_ID,
    team1: 'SRH',
    team2: 'RCB',
    date: openMatchDate,
    venue: 'Test Ground',
    status: 'UPCOMING',
    matchDesc: 'E2E Test Match',
  });
  await db.collection('matches').doc(TEST_MATCH_LOCKED_ID).set({
    id: TEST_MATCH_LOCKED_ID,
    seriesId: CRICKET_CONFIG.IPL_SERIES_ID,
    team1: 'SRH',
    team2: 'RCB',
    date: lockedMatchDate,
    venue: 'Test Ground',
    status: 'LIVE',
    matchDesc: 'E2E Locked Match',
  });
  await db.collection('matches').doc(TEST_MATCH_VISIBILITY_ID).set({
    id: TEST_MATCH_VISIBILITY_ID,
    seriesId: CRICKET_CONFIG.IPL_SERIES_ID,
    team1: 'SRH',
    team2: 'RCB',
    date: openMatchDate,
    venue: 'Test Ground',
    status: 'UPCOMING',
    matchDesc: 'E2E Visibility Test Match',
  });
  const pastMatchDate = new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(); // 3 days ago
  await db.collection('matches').doc(TEST_MATCH_PAST_ID).set({
    id: TEST_MATCH_PAST_ID,
    seriesId: CRICKET_CONFIG.IPL_SERIES_ID,
    team1: 'SRH',
    team2: 'RCB',
    date: pastMatchDate,
    venue: 'Test Ground',
    status: 'COMPLETE',
    matchDesc: 'E2E Past Match',
  });

  const scoredMatchDate = new Date(now - 5 * 60 * 60 * 1000).toISOString(); // 5h ago — completed
  await db.collection('matches').doc(TEST_MATCH_SCORED_ID).set({
    id: TEST_MATCH_SCORED_ID,
    seriesId: CRICKET_CONFIG.IPL_SERIES_ID,
    team1: 'SRH',
    team2: 'RCB',
    date: scoredMatchDate,
    venue: 'Test Ground',
    status: 'COMPLETE',
    matchDesc: 'E2E Scored Match',
    scoring: {
      finalizedAt: new Date().toISOString(),
      motmPlayerId: null,
      playerPoints: {},
    },
  });

  const batch = db.batch();
  TEST_PLAYERS.forEach((p) => batch.set(db.collection('players').doc(p.id), p));
  await batch.commit();

  for (const uid of [TEST_UID, TEST_UID_2, TEST_ADMIN_UID]) {
    try {
      await auth.deleteUser(uid);
    } catch {
      // didn't exist yet — fine
    }
  }
  await auth.createUser({ uid: TEST_UID, email: 'e2e-user@example.com', displayName: 'E2E User' });
  await auth.createUser({ uid: TEST_UID_2, email: 'e2e-user-2@example.com', displayName: 'E2E User Two' });
  await auth.createUser({ uid: TEST_ADMIN_UID, email: 'e2e-admin@example.com', displayName: 'E2E Admin' });
  await auth.setCustomUserClaims(TEST_ADMIN_UID, { admin: true });

  const scoredMatchDay = scoredMatchDate.slice(0, 10);
  await db
    .collection('userSquads')
    .doc(`${TEST_UID}_${TEST_MATCH_SCORED_ID}`)
    .set({
      userId: TEST_UID,
      matchId: TEST_MATCH_SCORED_ID,
      players: TEST_PLAYERS.slice(0, 3).map((p) => p.id),
      mvpId: TEST_PLAYERS[0].id,
      createdAt: Date.now(),
      matchTimestamp: scoredMatchDate,
      matchDay: scoredMatchDay,
      userDisplayName: 'E2E User',
      userPhotoURL: null,
      totalPoints: TEST_USER_SCORE,
    });
  await db
    .collection('userSquads')
    .doc(`${TEST_UID_2}_${TEST_MATCH_SCORED_ID}`)
    .set({
      userId: TEST_UID_2,
      matchId: TEST_MATCH_SCORED_ID,
      players: TEST_PLAYERS.slice(0, 3).map((p) => p.id),
      mvpId: TEST_PLAYERS[1].id,
      createdAt: Date.now(),
      matchTimestamp: scoredMatchDate,
      matchDay: scoredMatchDay,
      userDisplayName: 'E2E User Two',
      userPhotoURL: null,
      totalPoints: TEST_USER_2_SCORE,
    });

  const pastMatchDay = pastMatchDate.slice(0, 10);
  await db
    .collection('userSquads')
    .doc(`${TEST_UID}_${TEST_MATCH_PAST_ID}`)
    .set({
      userId: TEST_UID,
      matchId: TEST_MATCH_PAST_ID,
      players: TEST_PLAYERS.slice(0, 3).map((p) => p.id),
      mvpId: TEST_PLAYERS[0].id,
      createdAt: Date.now(),
      matchTimestamp: pastMatchDate,
      matchDay: pastMatchDay,
      userDisplayName: 'E2E User',
      userPhotoURL: null,
    });

  // Toss has already passed for TEST_MATCH_LOCKED_ID (started 1h ago) —
  // seeded directly since the UI itself blocks drafting once locked (see
  // draft.spec.ts). Owned by user2 so it doesn't collide with any squad
  // draft.spec.ts's user1 flows might expect for this match.
  const lockedMatchDay = lockedMatchDate.slice(0, 10);
  await db
    .collection('userSquads')
    .doc(`${TEST_UID_2}_${TEST_MATCH_LOCKED_ID}`)
    .set({
      userId: TEST_UID_2,
      matchId: TEST_MATCH_LOCKED_ID,
      players: TEST_PLAYERS.slice(0, 3).map((p) => p.id),
      mvpId: TEST_PLAYERS[0].id,
      createdAt: Date.now(),
      matchTimestamp: lockedMatchDate,
      matchDay: lockedMatchDay,
      userDisplayName: 'E2E User Two',
      userPhotoURL: null,
    });

  const userToken = await auth.createCustomToken(TEST_UID);
  const userToken2 = await auth.createCustomToken(TEST_UID_2);
  const adminToken = await auth.createCustomToken(TEST_ADMIN_UID);
  writeFileSync(TOKENS_FILE, JSON.stringify({ userToken, userToken2, adminToken }, null, 2));
}
