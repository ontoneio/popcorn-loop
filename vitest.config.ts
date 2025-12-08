import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.config.*',
        '**/*.test.*',
        '**/*.spec.*',
      ],
    },
  },
  resolve: {
    alias: {
      '@workspace/shared-types': resolve(__dirname, './packages/shared/types/src/index.ts'),
      '@workspace/shared-validators': resolve(__dirname, './packages/shared/validators/src/index.ts'),
      '@workspace/shared-utils': resolve(__dirname, './packages/shared/utils/src/index.ts'),
    },
  },
});
