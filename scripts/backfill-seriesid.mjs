// One-time migration: matches synced before seriesId was normalized to a
// string (to match CRICKET_CONFIG.IPL_SERIES_ID's type) have it stored as
// the raw number Cricbuzz returns. Season-scoped queries (getMatches,
// getEarliestMatchDate) filter with where('seriesId', '==', IPL_SERIES_ID),
// which is a string, so a numeric seriesId silently excludes that match.
// This backfills existing docs to string so those queries keep matching
// data synced before this change.
//
// Usage: node --env-file=.env.local scripts/backfill-seriesid.mjs [--dry-run]

import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

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

const matchesSnap = await db.collection('matches').get();

let updated = 0;
let skipped = 0;

for (const doc of matchesSnap.docs) {
  const seriesId = doc.data().seriesId;

  if (typeof seriesId === 'string') {
    skipped++;
    continue;
  }
  if (seriesId === undefined || seriesId === null) {
    console.warn(`Skipping ${doc.id}: no seriesId field`);
    skipped++;
    continue;
  }

  console.log(`${dryRun ? '[dry-run] ' : ''}Updating ${doc.id}: seriesId ${JSON.stringify(seriesId)} (${typeof seriesId}) -> "${String(seriesId)}"`);
  if (!dryRun) {
    await doc.ref.update({ seriesId: String(seriesId) });
  }
  updated++;
}

console.log(`\n${dryRun ? '[dry-run] ' : ''}Done. Updated ${updated}, already-string ${skipped}, total ${matchesSnap.size}.`);
