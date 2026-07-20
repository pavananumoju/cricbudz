import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import {
  initializeFirestore,
  connectFirestoreEmulator,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// IndexedDB persistence only makes sense in a real browser, and is disabled
// in E2E/emulator mode (NEXT_PUBLIC_USE_FIREBASE_EMULATOR) — each Playwright
// run seeds a fresh emulator dataset, and a stale cache surviving between
// test runs would make specs flaky in a way production never is.
const isBrowser = typeof window !== 'undefined';
const useEmulator = isBrowser && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true';

// Use experimentalForceLongPolling to avoid GRPC errors in some environments.
// persistentLocalCache (IndexedDB) lets navigating between pages (dashboard
// <-> fixtures <-> leaderboard) reuse already-fetched matches/players/squads
// instead of re-reading Firestore from scratch on every visit — see
// README.md's "Client-side Firestore cache" section for the staleness
// tradeoff this introduces (data can be briefly stale until the next
// snapshot sync) and where a manual refresh lives for each page.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  ignoreUndefinedProperties: true,
  ...(isBrowser && !useEmulator
    ? { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) }
    : {}),
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

if (useEmulator && !window.__firebaseEmulatorsConnected) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  window.__firebaseEmulatorsConnected = true;
}
