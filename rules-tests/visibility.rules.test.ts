// Documents (and guards against regressing) why the app does NOT enforce
// the submission-visibility toggle for cross-user userSquads reads via
// direct client Firestore `list` queries — only via `get` (single doc, e.g.
// a user's own squad) and the two server-side API routes
// (GET /api/leaderboard, GET /api/matches/[matchId]/squads) that
// reimplement the same policy using the Admin SDK. Run with
// `npm run test:rules` (boots the Firestore emulator for the duration of
// the run). See PROGRESS.md / README.md's "Submission Visibility Toggle"
// section for the full writeup.
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
import { collection, doc, getDoc, getDocs, query, setDoc, where, type Firestore } from 'firebase/firestore';

const PROJECT_ID = 'demo-cricbudz-rules-test';

let testEnv: RulesTestEnvironment;

// @firebase/rules-unit-testing@4's RulesTestContext.firestore() returns the
// firebase/compat Firestore type, but at runtime it's the same underlying
// instance the modular SDK (collection/doc/query/etc.) expects — this cast
// is the documented workaround for using the modular client API against it.
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

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

describe('userSquads list queries are unprovable while the visibility toggle is ON', () => {
  it('a matchId-only query for a DIFFERENT day\'s match is denied outright, even though the squad should be visible', async () => {
    const today = todayISODate();
    await seed(async (db) => {
      await setDoc(doc(db, 'settings', 'visibility'), { hideUntilToss: true, date: today });
      // Match happened yesterday — well outside the toggle's date — so the
      // squad SHOULD be visible to everyone under the intended policy.
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      await setDoc(doc(db, 'userSquads', 'userA_match-yesterday'), {
        userId: 'userA',
        matchId: 'match-yesterday',
        players: ['p1', 'p2', 'p3'],
        mvpId: 'p1',
        matchTimestamp: yesterday,
        matchDay: yesterday.slice(0, 10),
      });
    });

    const userB = testEnv.authenticatedContext('userB');
    const q = query(collection(modular(userB), 'userSquads'), where('matchId', '==', 'match-yesterday'));
    // Denied because the query only pins matchId, not matchDay, so the
    // rule's visibility check isn't provable across the result set.
    await assertFails(getDocs(q));
  });

  it('pinning matchDay alongside matchId fixes it for a DIFFERENT day\'s match', async () => {
    const today = todayISODate();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await seed(async (db) => {
      await setDoc(doc(db, 'settings', 'visibility'), { hideUntilToss: true, date: today });
      await setDoc(doc(db, 'userSquads', 'userA_match-yesterday'), {
        userId: 'userA',
        matchId: 'match-yesterday',
        players: ['p1', 'p2', 'p3'],
        mvpId: 'p1',
        matchTimestamp: yesterday,
        matchDay: yesterday.slice(0, 10),
      });
    });

    const userB = testEnv.authenticatedContext('userB');
    const q = query(
      collection(modular(userB), 'userSquads'),
      where('matchId', '==', 'match-yesterday'),
      where('matchDay', '==', yesterday.slice(0, 10))
    );
    // Pinning matchDay makes isVisibilityHiddenForDay(matchDay) a
    // per-query CONSTANT (yesterday != today's toggle date), so its
    // negation is provably true for every matching doc regardless of
    // owner/toss — the OR short-circuits true.
    await assertSucceeds(getDocs(q));
  });

  it('pinning matchDay does NOT fix it for a match on the toggle\'s OWN day, even post-toss — this is why Squad Room uses a server route instead', async () => {
    const today = todayISODate();
    await seed(async (db) => {
      await setDoc(doc(db, 'settings', 'visibility'), { hideUntilToss: true, date: today });
      // Match started an hour ago today — toss (30 min before start) has
      // definitely passed, so this squad SHOULD be visible to everyone.
      const startedAnHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      await setDoc(doc(db, 'userSquads', 'userA_match-today'), {
        userId: 'userA',
        matchId: 'match-today',
        players: ['p1', 'p2', 'p3'],
        mvpId: 'p1',
        matchTimestamp: startedAnHourAgo,
        matchDay: startedAnHourAgo.slice(0, 10),
      });
    });

    const userB = testEnv.authenticatedContext('userB');
    const q = query(
      collection(modular(userB), 'userSquads'),
      where('matchId', '==', 'match-today'),
      where('matchDay', '==', today)
    );
    // Here matchDay is pinned to a value EQUAL to the toggle's date, so
    // isVisibilityHiddenForDay(matchDay) is provably TRUE for the whole
    // query — its negation can't short-circuit the OR true anymore. The
    // other two OR branches (isOwner, hasTossPassed) depend on
    // resource.data.userId/matchTimestamp, neither pinned by any query
    // filter, so the rules engine can't prove the query safe even though
    // this specific document's toss really has passed. Denied outright.
    await assertFails(getDocs(q));
  });
});

describe('a single-document get() correctly evaluates hasTossPassed (unlike a list query)', () => {
  it('a post-toss squad for TODAY is readable by a non-owner while the toggle is ON for today', async () => {
    const today = todayISODate();
    await seed(async (db) => {
      await setDoc(doc(db, 'settings', 'visibility'), { hideUntilToss: true, date: today });
      const startedAnHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      await setDoc(doc(db, 'userSquads', 'userA_match-today-post-toss'), {
        userId: 'userA',
        matchId: 'match-today-post-toss',
        players: ['p1', 'p2', 'p3'],
        mvpId: 'p1',
        matchTimestamp: startedAnHourAgo,
        matchDay: startedAnHourAgo.slice(0, 10),
      });
    });

    const userB = testEnv.authenticatedContext('userB');
    const squadDoc = doc(modular(userB), 'userSquads', 'userA_match-today-post-toss');
    await assertSucceeds(getDoc(squadDoc));
  });

  it('control: a PRE-toss squad for today is still correctly denied to a non-owner (proves hasTossPassed evaluates the real timestamp, not just always-true)', async () => {
    const today = todayISODate();
    await seed(async (db) => {
      await setDoc(doc(db, 'settings', 'visibility'), { hideUntilToss: true, date: today });
      const startsInTwoHours = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
      await setDoc(doc(db, 'userSquads', 'userA_match-today-pre-toss'), {
        userId: 'userA',
        matchId: 'match-today-pre-toss',
        players: ['p1', 'p2', 'p3'],
        mvpId: 'p1',
        matchTimestamp: startsInTwoHours,
        matchDay: startsInTwoHours.slice(0, 10),
      });
    });

    const userB = testEnv.authenticatedContext('userB');
    const squadDoc = doc(modular(userB), 'userSquads', 'userA_match-today-pre-toss');
    await assertFails(getDoc(squadDoc));
  });

  it('the OWNER can always read their own squad regardless of the toggle', async () => {
    const today = todayISODate();
    await seed(async (db) => {
      await setDoc(doc(db, 'settings', 'visibility'), { hideUntilToss: true, date: today });
      const startsInTwoHours = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
      await setDoc(doc(db, 'userSquads', 'userA_match-today-pre-toss'), {
        userId: 'userA',
        matchId: 'match-today-pre-toss',
        players: ['p1', 'p2', 'p3'],
        mvpId: 'p1',
        matchTimestamp: startsInTwoHours,
        matchDay: startsInTwoHours.slice(0, 10),
      });
    });

    const userA = testEnv.authenticatedContext('userA');
    const squadDoc = doc(modular(userA), 'userSquads', 'userA_match-today-pre-toss');
    await assertSucceeds(getDoc(squadDoc));
  });
});

describe('the leaderboard\'s matchDay RANGE query is unprovable while the toggle is ON — this is why it uses a server route', () => {
  it('denies a matchDay range query even for a scored squad from a past day', async () => {
    const today = todayISODate();
    await seed(async (db) => {
      await setDoc(doc(db, 'settings', 'visibility'), { hideUntilToss: true, date: today });
      // A scored squad from a past day within the week range — always
      // meant to be visible to everyone (scoring only happens post-toss).
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
      await setDoc(doc(db, 'userSquads', 'userA_match-scored'), {
        userId: 'userA',
        matchId: 'match-scored',
        players: ['p1', 'p2', 'p3'],
        mvpId: 'p1',
        matchTimestamp: twoDaysAgo,
        matchDay: twoDaysAgo.slice(0, 10),
        totalPoints: 42,
      });
    });

    const userB = testEnv.authenticatedContext('userB');
    const startDay = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const q = query(
      collection(modular(userB), 'userSquads'),
      where('matchDay', '>=', startDay),
      where('matchDay', '<=', today)
    );
    await assertFails(getDocs(q));
  });
});
