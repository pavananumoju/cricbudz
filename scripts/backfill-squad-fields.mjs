// One-time migration: userSquads created before matchTimestamp/matchDay/
// userDisplayName/userPhotoURL were added to saveUserSquad() are missing
// those fields, which silently makes them invisible to the leaderboard
// (its query filters by matchDay) and to "Squad Room" (which shows
// userDisplayName). Backfills both from the linked match doc and the
// Firebase Auth user record.
//
// Usage: node --env-file=.env.local scripts/backfill-squad-fields.mjs [--dry-run]

import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const dryRun = process.argv.includes('--dry-run');

const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey,
  }),
});

const db = getFirestore(app, process.env.FIREBASE_DATABASE_ID);
const auth = getAuth(app);

const squadsSnap = await db.collection('userSquads').get();
const matchCache = new Map();
const userCache = new Map();

let updated = 0;
let skipped = 0;

for (const doc of squadsSnap.docs) {
  const squad = doc.data();
  const needsMatchFields = !squad.matchDay || !squad.matchTimestamp;
  const needsUserFields = squad.userDisplayName === undefined || squad.userPhotoURL === undefined;

  if (!needsMatchFields && !needsUserFields) {
    skipped++;
    continue;
  }

  const updates = {};

  if (needsMatchFields) {
    if (!matchCache.has(squad.matchId)) {
      const matchDoc = await db.collection('matches').doc(squad.matchId).get();
      matchCache.set(squad.matchId, matchDoc.exists ? matchDoc.data() : null);
    }
    const match = matchCache.get(squad.matchId);
    if (match?.date) {
      updates.matchTimestamp = match.date;
      updates.matchDay = match.date.slice(0, 10);
    } else {
      console.warn(`Skipping match fields for ${doc.id}: match ${squad.matchId} not found or has no date`);
    }
  }

  if (needsUserFields) {
    if (!userCache.has(squad.userId)) {
      try {
        const user = await auth.getUser(squad.userId);
        userCache.set(squad.userId, { displayName: user.displayName || null, photoURL: user.photoURL || null });
      } catch {
        userCache.set(squad.userId, { displayName: null, photoURL: null });
      }
    }
    const user = userCache.get(squad.userId);
    updates.userDisplayName = user.displayName;
    updates.userPhotoURL = user.photoURL;
  }

  if (Object.keys(updates).length === 0) {
    skipped++;
    continue;
  }

  console.log(`${dryRun ? '[dry-run] ' : ''}Updating ${doc.id}:`, updates);
  if (!dryRun) {
    await doc.ref.update(updates);
  }
  updated++;
}

console.log(`\n${dryRun ? '[dry-run] ' : ''}Done. Updated ${updated}, already-current ${skipped}, total ${squadsSnap.size}.`);
