import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'shared/src/**/*.test.ts',
      'server/src/**/*.test.ts',
    ],
  },
  resolve: {
    conditions: ['import', 'module', 'browser', 'default'],
    alias: {
      'dokoda-shared': './shared/src/index.ts',
    },
  },
});
