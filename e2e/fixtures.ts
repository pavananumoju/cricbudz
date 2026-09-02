import { test as base, expect, type Page, type Browser } from '@playwright/test';
import { readFileSync } from 'fs';
import { TOKENS_FILE, SIM_TOKENS_FILE, SIM_USERS } from './testData';

interface Tokens {
  userToken: string;
  userToken2: string;
  adminToken: string;
}

function readTokens(): Tokens {
  return JSON.parse(readFileSync(TOKENS_FILE, 'utf-8'));
}

function readSimTokens(): Record<string, string> {
  return JSON.parse(readFileSync(SIM_TOKENS_FILE, 'utf-8'));
}

type Fixtures = {
  signInAsUser: () => Promise<void>;
  signInAsUser2: () => Promise<void>;
  signInAsAdmin: () => Promise<void>;
};

export async function signInWithToken(page: Page, token: string) {
  await page.goto('/');
  await page.waitForFunction(
    () => typeof (window as unknown as Record<string, unknown>).__testSignInWithCustomToken === 'function'
  );
  await page.evaluate(
    (t) =>
      (
        window as unknown as { __testSignInWithCustomToken: (token: string) => Promise<unknown> }
      ).__testSignInWithCustomToken(t),
    token
  );
  await page.waitForURL('**/dashboard', { timeout: 15000 });
}

// Opens a fresh isolated browser session (own cookies/storage) and signs it
// in as sim user N (1-based). Each returned page is a distinct "friend".
// See e2e/MULTIUSER.md.
export async function newSimUserPage(browser: Browser, n: number): Promise<Page> {
  const tokens = readSimTokens();
  const uid = SIM_USERS.find((u) => u.n === n)!.uid;
  const page = await (await browser.newContext()).newPage();
  await signInWithToken(page, tokens[uid]);
  return page;
}

// Signs in every sim user. Returns pages indexed 0..N-1 (page[i] == "Sim
// Friend i+1"). Sign-in is sequential (10 parallel custom-token exchanges
// against the Auth emulator is flaky); the concurrency that matters is in
// what the specs then do with the pages. Caller closes the contexts.
export async function newAllSimUserPages(browser: Browser): Promise<Page[]> {
  const pages: Page[] = [];
  for (const u of SIM_USERS) pages.push(await newSimUserPage(browser, u.n));
  return pages;
}

export const test = base.extend<Fixtures>({
  signInAsUser: async ({ page }, use) => {
    await use(async () => {
      const { userToken } = readTokens();
      await signInWithToken(page, userToken);
    });
  },
  signInAsUser2: async ({ page }, use) => {
    await use(async () => {
      const { userToken2 } = readTokens();
      await signInWithToken(page, userToken2);
    });
  },
  signInAsAdmin: async ({ page }, use) => {
    await use(async () => {
      const { adminToken } = readTokens();
      await signInWithToken(page, adminToken);
    });
  },
});

export { expect };
