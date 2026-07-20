// One-time migration: userSquads created before playerNames was denormalized
// onto the doc (audit item #6) only have a `players` ID array, so the
// dashboard has no way to show trio surnames without fetching the entire
// players collection. Backfills playerNames (same order as `players`) by
// looking up each player doc once and caching by ID across all squads.
//
// Usage: node --env-file=.env.local scripts/backfill-squad-playernames.mjs [--dry-run]

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

const squadsSnap = await db.collection('userSquads').get();
const playerCache = new Map();

let updated = 0;
let skipped = 0;

for (const doc of squadsSnap.docs) {
  const squad = doc.data();

  if (Array.isArray(squad.playerNames) && squad.playerNames.length === squad.players?.length) {
    skipped++;
    continue;
  }

  const names = [];
  for (const playerId of squad.players || []) {
    if (!playerCache.has(playerId)) {
      const playerDoc = await db.collection('players').doc(playerId).get();
      playerCache.set(playerId, playerDoc.exists ? playerDoc.data().name || null : null);
    }
    names.push(playerCache.get(playerId));
  }

  if (names.some((n) => n === null)) {
    console.warn(`Skipping ${doc.id}: at least one player ID no longer resolves in players collection`, squad.players);
    skipped++;
    continue;
  }

  console.log(`${dryRun ? '[dry-run] ' : ''}Updating ${doc.id}: playerNames -> ${JSON.stringify(names)}`);
  if (!dryRun) {
    await doc.ref.update({ playerNames: names });
  }
  updated++;
}

console.log(`\n${dryRun ? '[dry-run] ' : ''}Done. Updated ${updated}, already-current/skipped ${skipped}, total ${squadsSnap.size}.`);
