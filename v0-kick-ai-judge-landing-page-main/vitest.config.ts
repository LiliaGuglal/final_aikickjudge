import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./lib/vector-search/__tests__/setup.ts'],
    testTimeout: 30000, // 30 seconds for integration tests
    hookTimeout: 10000, // 10 seconds for setup/teardown
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});