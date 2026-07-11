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
import {
  PROJECT_ID,
  DATABASE_ID,
  TEST_UID,
  TEST_UID_2,
  TEST_ADMIN_UID,
  TEST_MATCH_ID,
  TEST_MATCH_LOCKED_ID,
  TEST_MATCH_VISIBILITY_ID,
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
    team1: 'SRH',
    team2: 'RCB',
    date: openMatchDate,
    venue: 'Test Ground',
    status: 'UPCOMING',
    matchDesc: 'E2E Test Match',
  });
  await db.collection('matches').doc(TEST_MATCH_LOCKED_ID).set({
    id: TEST_MATCH_LOCKED_ID,
    team1: 'SRH',
    team2: 'RCB',
    date: lockedMatchDate,
    venue: 'Test Ground',
    status: 'LIVE',
    matchDesc: 'E2E Locked Match',
  });
  await db.collection('matches').doc(TEST_MATCH_VISIBILITY_ID).set({
    id: TEST_MATCH_VISIBILITY_ID,
    team1: 'SRH',
    team2: 'RCB',
    date: openMatchDate,
    venue: 'Test Ground',
    status: 'UPCOMING',
    matchDesc: 'E2E Visibility Test Match',
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

  const userToken = await auth.createCustomToken(TEST_UID);
  const userToken2 = await auth.createCustomToken(TEST_UID_2);
  const adminToken = await auth.createCustomToken(TEST_ADMIN_UID);
  writeFileSync(TOKENS_FILE, JSON.stringify({ userToken, userToken2, adminToken }, null, 2));
}
