import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config for the DevMatch frontend.
// The compiled contract + ZK assets are copied into src/generated and
// public/zk by the `prepare:contract` script (auto-run pre-dev/pre-build).
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2022',
  },
  optimizeDeps: {
    // The midnight-js stack ships ESM-only WASM modules; keep them external to
    // avoid esbuild pre-bundling issues.
    exclude: [
      '@midnight-ntwrk/compact-runtime',
      '@midnight-ntwrk/midnight-js-protocol',
    ],
  },
});
