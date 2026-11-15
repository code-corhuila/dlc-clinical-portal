import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    // Build tests run Vite builds; they have their own sequential step (test:build).
    exclude: [...configDefaults.exclude, '**/*.build.test.ts'],
    // Room for the 5 s async queries of src/test/setup.ts when jsdom workers share the CPU.
    testTimeout: 15000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      include: ['src/clinical/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/test/**',
        'src/clinical/test/**',
      ],
    },
  },
});
