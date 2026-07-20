import { defineConfig } from 'vitest/config';

// Separate from vitest.config.ts (jsdom, src/**) because these tests exercise
// firestore.rules against a live Firestore emulator over the network and
// must run in a Node environment. Run via `npm run test:rules`, which boots
// the emulator for the duration of the run.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['rules-tests/**/*.rules.test.ts'],
    globals: true,
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
