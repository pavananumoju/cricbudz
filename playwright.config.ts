import { defineConfig, devices } from '@playwright/test';
import { PROJECT_ID, DATABASE_ID } from './e2e/testData';

// Requires the Firebase Emulator Suite running (`npm run emulators`) before
// `npm run test:e2e`. globalSetup seeds fixed test data into the emulator;
// the dev server it spins up talks to the emulator, never real Firestore.
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: false,
  // Specs share seeded emulator state (same test users/matches) rather than
  // each getting an isolated database, so cross-file parallelism causes real
  // races (e.g. two specs both drafting as the same test user). Serial only.
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  // Cold API routes (first hit compiles the route + inits the Admin SDK) and a
  // slow CI runner both blow the 5s default. 15s keeps assertions honest
  // while surviving cold-start.
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: 'http://127.0.0.1:3100',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    navigationTimeout: 30_000,
    actionTimeout: 15_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'PORT=3100 npm run dev',
    url: 'http://127.0.0.1:3100',
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_USE_FIREBASE_EMULATOR: 'true',
      // Server-side API routes (e.g. GET /api/leaderboard) use the Admin
      // SDK, which isn't gated by NEXT_PUBLIC_USE_FIREBASE_EMULATOR (that
      // only affects the client SDK). With these set, firebase-admin.ts
      // skips real service-account credentials and talks straight to the
      // emulator — so E2E runs with no .env.local (e.g. in CI). The
      // project/database IDs MUST match what e2e/seed.ts writes to.
      FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
      FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
      FIREBASE_PROJECT_ID: PROJECT_ID,
      FIREBASE_DATABASE_ID: DATABASE_ID,
    },
  },
});
