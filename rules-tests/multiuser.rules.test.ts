// Tier-1 of the multi-user test standard (e2e/MULTIUSER.md): proves
// firestore.rules keeps 10 friends' squads isolated — each can only write
// their own, and the hide-until-toss toggle actually blocks a cross-user
// single-doc read pre-toss. Run with `npm run test:rules`.
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
import { doc, getDoc, setDoc, type Firestore } from 'firebase/firestore';

const PROJECT_ID = 'demo-cricbudz-multiuser-test';
const MATCH_ID = 'sim-match';
const UIDS = Array.from({ length: 10 }, (_, i) => `sim-user-${i + 1}`);

let testEnv: RulesTestEnvironment;
const modular = (ctx: RulesTestContext) => ctx.firestore() as unknown as Firestore;

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
afterAll(async () => testEnv.cleanup());
beforeEach(async () => testEnv.clearFirestore());

async function seed(fn: (db: Firestore) => Promise<void>) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => fn(modular(ctx)));
}

function squad(uid: string, matchStart: string, overrides: Record<string, unknown> = {}) {
  return {
    userId: uid,
    matchId: MATCH_ID,
    players: ['p1', 'p2', 'p3'],
    playerNames: ['One', 'Two', 'Three'],
    mvpId: 'p1',
    matchTimestamp: matchStart,
    matchDay: matchStart.slice(0, 10),
    userDisplayName: uid,
    userPhotoURL: null,
    ...overrides,
  };
}

describe('10-user squad isolation', () => {
  const preToss = () => new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();

  it('every one of the 10 users can write their own squad pre-toss', async () => {
    const start = preToss();
    await seed(async (db) => setDoc(doc(db, 'matches', MATCH_ID), { id: MATCH_ID, date: start }));
    for (const uid of UIDS) {
      const ctx = testEnv.authenticatedContext(uid);
      await assertSucceeds(setDoc(doc(modular(ctx), 'userSquads', `${uid}_${MATCH_ID}`), squad(uid, start)));
    }
  });

  it("a user cannot write another user's squad document", async () => {
    const start = preToss();
    await seed(async (db) => setDoc(doc(db, 'matches', MATCH_ID), { id: MATCH_ID, date: start }));
    const attacker = testEnv.authenticatedContext('sim-user-2');
    // victim's doc id, victim's userId
    await assertFails(
      setDoc(doc(modular(attacker), 'userSquads', `sim-user-1_${MATCH_ID}`), squad('sim-user-1', start))
    );
    // victim's doc id, attacker's own userId (doc-id / userId mismatch)
    await assertFails(
      setDoc(doc(modular(attacker), 'userSquads', `sim-user-1_${MATCH_ID}`), squad('sim-user-2', start))
    );
  });

  it('hide-until-toss blocks a cross-user read pre-toss but never the owner', async () => {
    const start = preToss();
    const day = start.slice(0, 10);
    await seed(async (db) => {
      await setDoc(doc(db, 'matches', MATCH_ID), { id: MATCH_ID, date: start });
      await setDoc(doc(db, 'settings', 'visibility'), { hideUntilToss: true, date: day });
      for (const uid of UIDS) await setDoc(doc(db, 'userSquads', `${uid}_${MATCH_ID}`), squad(uid, start));
    });

    const u1 = modular(testEnv.authenticatedContext('sim-user-1'));
    const u2 = modular(testEnv.authenticatedContext('sim-user-2'));
    await assertSucceeds(getDoc(doc(u1, 'userSquads', `sim-user-1_${MATCH_ID}`))); // own — always
    await assertFails(getDoc(doc(u2, 'userSquads', `sim-user-1_${MATCH_ID}`))); // rival — hidden
  });

  it('post-toss, a cross-user read is allowed even with the toggle on', async () => {
    const start = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // started 1h ago
    const day = start.slice(0, 10);
    await seed(async (db) => {
      await setDoc(doc(db, 'matches', MATCH_ID), { id: MATCH_ID, date: start });
      await setDoc(doc(db, 'settings', 'visibility'), { hideUntilToss: true, date: day });
      await setDoc(doc(db, 'userSquads', `sim-user-1_${MATCH_ID}`), squad('sim-user-1', start));
    });
    const u2 = modular(testEnv.authenticatedContext('sim-user-2'));
    await assertSucceeds(getDoc(doc(u2, 'userSquads', `sim-user-1_${MATCH_ID}`)));
  });
});
