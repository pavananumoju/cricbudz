// Removes one user and all their data — for offboarding someone who leaves
// the friend group (AUDIT.md P2-16). Deletes:
//   - their Firebase Auth account
//   - every userSquads/{uid}_* document they own
//
// Usage:
//   node --env-file=.env.local scripts/delete-user.mjs someone@example.com
//   node --env-file=.env.local scripts/delete-user.mjs someone@example.com --confirm
//
// Without --confirm this only PRINTS what it would delete (dry run). Add
// --confirm to actually delete. There is no undo — take a backup first
// (/admin → Download Backup, or scripts/restore-firestore.mjs's source data).
import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const email = process.argv[2];
const confirm = process.argv.includes('--confirm');

if (!email || email.startsWith('--')) {
  console.error('Usage: node --env-file=.env.local scripts/delete-user.mjs <email> [--confirm]');
  process.exit(1);
}

const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey,
  }),
});

const auth = getAuth(app);
const db = getFirestore(app, process.env.FIREBASE_DATABASE_ID);

let user;
try {
  user = await auth.getUserByEmail(email);
} catch {
  console.error(`No Firebase Auth user with email ${email}.`);
  process.exit(1);
}
const uid = user.uid;
console.log(`User: ${user.displayName || '(no name)'} <${email}>  uid=${uid}`);

// userSquads doc IDs are `${uid}_${matchId}`, so a prefix scan on the doc ID.
const snap = await db
  .collection('userSquads')
  .where('userId', '==', uid)
  .get();
console.log(`userSquads owned: ${snap.size}`);
snap.docs.forEach((d) => console.log(`  - ${d.id} (match ${d.data().matchId})`));

if (!confirm) {
  console.log('\nDry run only — nothing was deleted. Re-run with --confirm to actually delete.');
  process.exit(0);
}

const batch = db.batch();
snap.docs.forEach((d) => batch.delete(d.ref));
await batch.commit();
console.log(`Deleted ${snap.size} userSquads document(s).`);

await auth.deleteUser(uid);
console.log(`Deleted Firebase Auth account for ${email}.`);
console.log('\nDone. Historical leaderboard weeks recompute live, so past standings will no longer include this user.');
