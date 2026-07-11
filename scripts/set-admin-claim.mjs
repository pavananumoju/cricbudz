import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const email = process.argv[2];
if (!email) {
  console.error('Usage: node --env-file=.env.local scripts/set-admin-claim.mjs you@example.com');
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

const user = await getAuth(app).getUserByEmail(email);
await getAuth(app).setCustomUserClaims(user.uid, { admin: true });
console.log(`admin:true claim set for ${email} (uid: ${user.uid})`);
console.log('Sign out and back in for the claim to appear in your session.');
