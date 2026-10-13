import { defineConfig } from 'vitest/config';

/**
 * Build tests (entry.js contract and the real-build synthetic-data guard).
 * They run Vite builds, so they run alone and one file at a time to keep the
 * jsdom suite free of CPU contention.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.build.test.ts'],
    fileParallelism: false,
    testTimeout: 120_000,
  },
});
