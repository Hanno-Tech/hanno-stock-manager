import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // E2E do Playwright fica fora do Vitest.
    exclude: ['e2e/**', 'node_modules/**'],
  },
});
