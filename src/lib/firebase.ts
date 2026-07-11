import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { initializeFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Use experimentalForceLongPolling to avoid GRPC errors in some environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  ignoreUndefinedProperties: true,
}, firebaseConfig.firestoreDatabaseId || '(default)');

export const auth = getAuth(app);

// Playwright E2E tests run against the Firebase Emulator Suite (see
// firebase.json / e2e/) instead of real production Auth+Firestore data.
// Guarded against Fast Refresh re-running this module and trying to
// connect twice, which Firebase throws on.
declare global {
  interface Window {
    __firebaseEmulatorsConnected?: boolean;
  }
}

if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true' && !window.__firebaseEmulatorsConnected) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  window.__firebaseEmulatorsConnected = true;
}
