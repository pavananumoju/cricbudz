// Audit item #2: proves firestore.rules enforces the lock window (toss = 30
// min before match start), squad shape, and cross-checks the denormalized
// matchTimestamp/matchDay against the real match doc on every userSquads
// write — not just ownership. Run with `npm run test:rules`.
//
// Note: request.time in Firestore rules is always the real server clock
// (the emulator has no time-mocking hook for it, and the app's Dev Control
// Center date override doesn't reach rules evaluation either — see
// README.md's "Submission Visibility Toggle" caveat). So instead of mocking
// time, every test computes its matchTimestamp relative to the real
// Date.now() to land on either side of the lock window — same pattern
// visibility.rules.test.ts already uses.
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
import { deleteDoc, doc, setDoc, type Firestore } from 'firebase/firestore';

const PROJECT_ID = 'demo-cricbudz-squad-write-test';

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

const MATCH_ID = 'match-1';

function honestSquad(overrides: Partial<Record<string, unknown>> = {}) {
  const matchStart = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2h out, well pre-toss
  return {
    userId: 'userA',
    matchId: MATCH_ID,
    players: ['p1', 'p2', 'p3'],
    mvpId: 'p1',
    matchTimestamp: matchStart,
    matchDay: matchStart.slice(0, 10),
    ...overrides,
  };
}

describe('lock window: toss = 30 min before match start', () => {
  it('denies a squad update 10 minutes after toss', async () => {
    // matchStart 20 min from now => toss (start - 30min) was 10 min ago.
    const matchStart = new Date(Date.now() + 20 * 60 * 1000).toISOString();
    await seed(async (db) => {
      await setDoc(doc(db, 'matches', MATCH_ID), { id: MATCH_ID, date: matchStart });
      await setDoc(
        doc(db, 'userSquads', `userA_${MATCH_ID}`),
        honestSquad({ matchTimestamp: matchStart, matchDay: matchStart.slice(0, 10) })
      );
    });

    const userA = testEnv.authenticatedContext('userA');
    await assertFails(
      setDoc(
        doc(modular(userA), 'userSquads', `userA_${MATCH_ID}`),
        honestSquad({ players: ['p1', 'p2', 'p4'], mvpId: 'p4', matchTimestamp: matchStart, matchDay: matchStart.slice(0, 10) })
      )
    );
  });

  it('allows a squad update well before toss (pre-lock control)', async () => {
    const matchStart = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    await seed(async (db) => {
      await setDoc(doc(db, 'matches', MATCH_ID), { id: MATCH_ID, date: matchStart });
      await setDoc(
        doc(db, 'userSquads', `userA_${MATCH_ID}`),
        honestSquad({ matchTimestamp: matchStart, matchDay: matchStart.slice(0, 10) })
      );
    });

    const userA = testEnv.authenticatedContext('userA');
    await assertSucceeds(
      setDoc(
        doc(modular(userA), 'userSquads', `userA_${MATCH_ID}`),
        honestSquad({ players: ['p1', 'p2', 'p4'], mvpId: 'p4', matchTimestamp: matchStart, matchDay: matchStart.slice(0, 10) })
      )
    );
  });

  it('denies a post-toss delete', async () => {
    const matchStart = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // started an hour ago
    await seed(async (db) => {
      await setDoc(doc(db, 'matches', MATCH_ID), { id: MATCH_ID, date: matchStart });
      await setDoc(
        doc(db, 'userSquads', `userA_${MATCH_ID}`),
        honestSquad({ matchTimestamp: matchStart, matchDay: matchStart.slice(0, 10) })
      );
    });

    const userA = testEnv.authenticatedContext('userA');
    await assertFails(deleteDoc(doc(modular(userA), 'userSquads', `userA_${MATCH_ID}`)));
  });

  it('allows a pre-toss delete (pre-lock control)', async () => {
    const matchStart = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    await seed(async (db) => {
      await setDoc(doc(db, 'matches', MATCH_ID), { id: MATCH_ID, date: matchStart });
      await setDoc(
        doc(db, 'userSquads', `userA_${MATCH_ID}`),
        honestSquad({ matchTimestamp: matchStart, matchDay: matchStart.slice(0, 10) })
      );
    });

    const userA = testEnv.authenticatedContext('userA');
    await assertSucceeds(deleteDoc(doc(modular(userA), 'userSquads', `userA_${MATCH_ID}`)));
  });

  it('denies a create for a match whose toss has already passed', async () => {
    const matchStart = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    await seed(async (db) => {
      await setDoc(doc(db, 'matches', MATCH_ID), { id: MATCH_ID, date: matchStart });
    });

    const userA = testEnv.authenticatedContext('userA');
    await assertFails(
      setDoc(
        doc(modular(userA), 'userSquads', `userA_${MATCH_ID}`),
        honestSquad({ matchTimestamp: matchStart, matchDay: matchStart.slice(0, 10) })
      )
    );
  });

  it('allows the honest pre-lock flow end to end: create, edit, delete', async () => {
    const matchStart = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    await seed(async (db) => {
      await setDoc(doc(db, 'matches', MATCH_ID), { id: MATCH_ID, date: matchStart });
    });

    const userA = testEnv.authenticatedContext('userA');
    const squadRef = doc(modular(userA), 'userSquads', `userA_${MATCH_ID}`);
    const data = honestSquad({ matchTimestamp: matchStart, matchDay: matchStart.slice(0, 10) });
    await assertSucceeds(setDoc(squadRef, data));
    await assertSucceeds(setDoc(squadRef, { ...data, players: ['p1', 'p2', 'p4'], mvpId: 'p4' }));
    await assertSucceeds(deleteDoc(squadRef));
  });
});

describe('source-of-truth cross-check: denormalized fields can no longer be spoofed', () => {
  it('denies a spoofed matchTimestamp that disagrees with the real match doc', async () => {
    const realMatchStart = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // toss already passed
    const spoofedTimestamp = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // claims 30 days out
    await seed(async (db) => {
      await setDoc(doc(db, 'matches', MATCH_ID), { id: MATCH_ID, date: realMatchStart });
    });

    const userA = testEnv.authenticatedContext('userA');
    await assertFails(
      setDoc(
        doc(modular(userA), 'userSquads', `userA_${MATCH_ID}`),
        honestSquad({ matchTimestamp: spoofedTimestamp, matchDay: spoofedTimestamp.slice(0, 10) })
      )
    );
  });

  it('denies a matchDay that disagrees with matchTimestamp', async () => {
    const matchStart = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    await seed(async (db) => {
      await setDoc(doc(db, 'matches', MATCH_ID), { id: MATCH_ID, date: matchStart });
    });

    const userA = testEnv.authenticatedContext('userA');
    await assertFails(
      setDoc(
        doc(modular(userA), 'userSquads', `userA_${MATCH_ID}`),
        honestSquad({ matchTimestamp: matchStart, matchDay: '2099-01-01' })
      )
    );
  });

  it('denies a create for a nonexistent matchId', async () => {
    const userA = testEnv.authenticatedContext('userA');
    const matchStart = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    await assertFails(
      setDoc(
        doc(modular(userA), 'userSquads', 'userA_no-such-match'),
        honestSquad({ matchId: 'no-such-match', matchTimestamp: matchStart, matchDay: matchStart.slice(0, 10) })
      )
    );
  });
});

describe('shape validation: exactly 3 players, MVP among them, doc ID matches userId_matchId', () => {
  const matchStart = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, 'matches', MATCH_ID), { id: MATCH_ID, date: matchStart });
    });
  });

  it('denies a 4-player squad', async () => {
    const userA = testEnv.authenticatedContext('userA');
    await assertFails(
      setDoc(
        doc(modular(userA), 'userSquads', `userA_${MATCH_ID}`),
        honestSquad({ players: ['p1', 'p2', 'p3', 'p4'], matchTimestamp: matchStart, matchDay: matchStart.slice(0, 10) })
      )
    );
  });

  it('denies a 5-player squad', async () => {
    const userA = testEnv.authenticatedContext('userA');
    await assertFails(
      setDoc(
        doc(modular(userA), 'userSquads', `userA_${MATCH_ID}`),
        honestSquad({
          players: ['p1', 'p2', 'p3', 'p4', 'p5'],
          matchTimestamp: matchStart,
          matchDay: matchStart.slice(0, 10),
        })
      )
    );
  });

  it('denies mvpId not present in players', async () => {
    const userA = testEnv.authenticatedContext('userA');
    await assertFails(
      setDoc(
        doc(modular(userA), 'userSquads', `userA_${MATCH_ID}`),
        honestSquad({ mvpId: 'p99', matchTimestamp: matchStart, matchDay: matchStart.slice(0, 10) })
      )
    );
  });

  it('denies a doc ID that does not match {userId}_{matchId}', async () => {
    const userA = testEnv.authenticatedContext('userA');
    await assertFails(
      setDoc(
        doc(modular(userA), 'userSquads', `userA_wrong-id`),
        honestSquad({ matchTimestamp: matchStart, matchDay: matchStart.slice(0, 10) })
      )
    );
  });

  it('allows an honest, correctly-shaped squad', async () => {
    const userA = testEnv.authenticatedContext('userA');
    await assertSucceeds(
      setDoc(
        doc(modular(userA), 'userSquads', `userA_${MATCH_ID}`),
        honestSquad({ matchTimestamp: matchStart, matchDay: matchStart.slice(0, 10) })
      )
    );
  });
});
