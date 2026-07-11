// Restores a backup JSON file (downloaded from /admin's "Download Backup"
// button, or produced by this same script's sibling export) back into
// Firestore. Deliberately a script, not an admin UI button — restoring can
// silently overwrite live data with stale data, so it should always go
// through someone deliberately running a command, not a misclick.
//
// Usage:
//   node --env-file=.env.local scripts/restore-firestore.mjs backup.json
//   node --env-file=.env.local scripts/restore-firestore.mjs backup.json --confirm
//
// Without --confirm this only PRINTS what it would do (dry run). Add
// --confirm to actually write. This fully overwrites each document in the
// backup (not a merge) — the whole point of a restore is reconstructing
// exact prior state.

import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

const filePath = process.argv[2];
const confirm = process.argv.includes('--confirm');

if (!filePath) {
  console.error('Usage: node --env-file=.env.local scripts/restore-firestore.mjs <backup.json> [--confirm]');
  process.exit(1);
}

const backup = JSON.parse(readFileSync(filePath, 'utf-8'));
if (!backup.collections) {
  console.error('This file does not look like a CricBudz backup (missing "collections" key).');
  process.exit(1);
}

console.log(`Backup exported at: ${backup.exportedAt}`);
for (const [collectionName, docs] of Object.entries(backup.collections)) {
  console.log(`  ${collectionName}: ${Object.keys(docs).length} document(s)`);
}

if (!confirm) {
  console.log('\nDry run only — nothing was written. Re-run with --confirm to actually restore.');
  process.exit(0);
}

const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey,
  }),
});
const db = getFirestore(app, process.env.FIREBASE_DATABASE_ID);

console.log('\nRestoring...');
for (const [collectionName, docs] of Object.entries(backup.collections)) {
  const entries = Object.entries(docs);
  // Firestore batches cap at 500 writes.
  for (let i = 0; i < entries.length; i += 500) {
    const batch = db.batch();
    entries.slice(i, i + 500).forEach(([docId, data]) => {
      batch.set(db.collection(collectionName).doc(docId), data);
    });
    await batch.commit();
  }
  console.log(`  Restored ${entries.length} document(s) to ${collectionName}`);
}

console.log('\nDone.');
