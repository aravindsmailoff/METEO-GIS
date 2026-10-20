import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: [
      { find: /^react-native$/, replacement: path.resolve(__dirname, 'web-rn-shim.ts') },
    ],
  },
  test: {
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
    testTimeout: 15000,
  },
});
