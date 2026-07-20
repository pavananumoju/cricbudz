// Audit item #3: proves auditLog is admin-read-only with no client write
// path at all — every real write to it goes through the Admin SDK (from
// finalize-match and admin/users routes), which bypasses these rules
// entirely, so `allow write: if false` here is confirming absence of a
// client path, not doing enforcement itself. Run with `npm run test:rules`.
import { readFileSync } from 'fs';
import path from 'path';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
  type RulesTestContext,
} from '@firebase/rules-unit-testing';
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, type Firestore } from 'firebase/firestore';

const PROJECT_ID = 'demo-cricbudz-audit-log-test';

let testEnv: RulesTestEnvironment;

function modular(ctx: RulesTestContext): Firestore {
  return ctx.firestore() as unknown as Firestore;
}

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(path.resolve(__dirname, '../firestore.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

async function seed(fn: (db: Firestore) => Promise<void>) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await fn(modular(ctx));
  });
}

const LOG_ID = 'log-1';

function auditLogEntry() {
  return {
    action: 'finalize_match',
    actorUid: 'admin-1',
    matchId: 'match-1',
    at: new Date().toISOString(),
  };
}

describe('auditLog: admin-read-only, no client write path', () => {
  it('denies a signed-in non-admin from reading a single log entry', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'auditLog', LOG_ID), auditLogEntry());
    });
    const userA = testEnv.authenticatedContext('userA');
    await assertFails(getDoc(doc(modular(userA), 'auditLog', LOG_ID)));
  });

  it('denies a signed-in non-admin from listing auditLog', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'auditLog', LOG_ID), auditLogEntry());
    });
    const userA = testEnv.authenticatedContext('userA');
    await assertFails(getDocs(collection(modular(userA), 'auditLog')));
  });

  it('allows an admin to read a single log entry', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'auditLog', LOG_ID), auditLogEntry());
    });
    const admin = testEnv.authenticatedContext('admin-1', { admin: true });
    await assertSucceeds(getDoc(doc(modular(admin), 'auditLog', LOG_ID)));
  });

  it('allows an admin to list auditLog', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'auditLog', LOG_ID), auditLogEntry());
    });
    const admin = testEnv.authenticatedContext('admin-1', { admin: true });
    await assertSucceeds(getDocs(collection(modular(admin), 'auditLog')));
  });

  it('denies a client write even from an admin (Admin SDK is the only write path)', async () => {
    const admin = testEnv.authenticatedContext('admin-1', { admin: true });
    await assertFails(setDoc(doc(modular(admin), 'auditLog', LOG_ID), auditLogEntry()));
  });

  it('denies a client delete even from an admin', async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'auditLog', LOG_ID), auditLogEntry());
    });
    const admin = testEnv.authenticatedContext('admin-1', { admin: true });
    await assertFails(deleteDoc(doc(modular(admin), 'auditLog', LOG_ID)));
  });
});
