import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**'],
    globals: true,
    // The whole app canonicalizes "what day is it" on India Standard Time
    // (CLAUDE.md item #8). Pin the test runner to the same zone so
    // timezone-naive date literals in specs (e.g. leaderboard week math)
    // behave identically on a contributor's IST machine and a UTC CI runner.
    // Specs that deliberately test cross-timezone behavior still override
    // process.env.TZ themselves and restore it.
    env: { TZ: 'Asia/Kolkata' },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
