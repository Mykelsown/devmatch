import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';

// Vite config for the DevMatch frontend.
// The compiled contract + ZK assets are copied into src/generated and
// public/zk by the `prepare:contract` script (auto-run pre-dev/pre-build).
//
// The Midnight onchain runtime ships ESM modules that `import` a .wasm file
// directly, which plain Vite cannot bundle — `vite-plugin-wasm` is the
// standard fix used by Midnight.js browser examples. The build target es2022
// emits top-level await natively, so no top-level-await transform plugin is
// needed (vite-plugin-top-level-await also pulls in @swc/core's native
// binary, which crashed this machine with SIGBUS).
export default defineConfig({
  plugins: [react(), wasm()],
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
    include: [
      // compact-runtime's raw ESM entry imports object-inspect (a CommonJS
      // package). Because compact-runtime is excluded from pre-bundling, that
      // bare import would otherwise be served raw to the browser, which then
      // fails with "doesn't provide an export named: 'default'". Forcing it
      // into the pre-bundler gives esbuild the chance to emit the interop
      // default export the browser needs.
      'object-inspect',
    ],
  },
});
