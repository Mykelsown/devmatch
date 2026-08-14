import { defineConfig } from 'vitest/config';

// Frontend unit tests run in Node (no DOM needed — component rendering is
// asserted via react-dom/server). This config deliberately does NOT extend
// vite.config.ts, whose vite-plugin-wasm + Midnight SDK optimizeDeps setup is
// for the browser build and would slow down / break the test run.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
