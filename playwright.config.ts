import { defineConfig, devices } from '@playwright/test';

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
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3100',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'PORT=3100 npm run dev',
    url: 'http://127.0.0.1:3100',
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_USE_FIREBASE_EMULATOR: 'true',
    },
  },
});
