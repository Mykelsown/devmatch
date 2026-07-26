import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 3_600_000,
    hookTimeout: 3_600_000,
  },
});
