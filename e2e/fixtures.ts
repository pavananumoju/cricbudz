import { test as base, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { TOKENS_FILE } from './testData';

interface Tokens {
  userToken: string;
  userToken2: string;
  adminToken: string;
}

function readTokens(): Tokens {
  return JSON.parse(readFileSync(TOKENS_FILE, 'utf-8'));
}

type Fixtures = {
  signInAsUser: () => Promise<void>;
  signInAsUser2: () => Promise<void>;
  signInAsAdmin: () => Promise<void>;
};

async function signInWithToken(page: import('@playwright/test').Page, token: string) {
  await page.goto('/');
  await page.waitForFunction(() => typeof (window as unknown as Record<string, unknown>).__testSignInWithCustomToken === 'function');
  await page.evaluate(
    (t) => (window as unknown as { __testSignInWithCustomToken: (token: string) => Promise<unknown> }).__testSignInWithCustomToken(t),
    token
  );
  await page.waitForURL('**/dashboard', { timeout: 15000 });
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
