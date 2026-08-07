/**
 * Browser polyfills required by the Midnight SDK.
 *
 * The @midnight-ntwrk packages were authored for Node and reference Node
 * globals (`Buffer`, `global`, `process`) at module load time. Vite's dev
 * esbuild pre-bundling keeps those references as bare globals, so the browser
 * crashes while evaluating the dependency chunks — e.g. the indexer provider
 * calls `Buffer.alloc` at load, throwing
 * `TypeError: Cannot read properties of undefined (reading 'alloc')`. That
 * kills the whole module graph before React mounts, and since Vite injects
 * CSS via JS, the page renders blank white.
 *
 * This module MUST be imported first in `main.tsx` so the globals exist
 * before any Midnight module evaluates.
 */
import { Buffer } from 'buffer';

const g = globalThis as unknown as Record<string, unknown>;

if (typeof g.Buffer === 'undefined') {
  // `buffer` is the browser-compatible Buffer implementation (same API).
  g.Buffer = Buffer;
}
if (typeof g.global === 'undefined') {
  // Some browser-shimmed packages (e.g. isomorphic-ws) read `global.WebSocket`.
  g.global = globalThis;
}
if (typeof g.process === 'undefined') {
  // Intentionally minimal: the SDK only needs `env` / `nextTick` at load time.
  // NODE_ENV mirrors the actual Vite mode so production bundles don't get a
  // stale 'development' value.
  g.process = {
    browser: true,
    env: { NODE_ENV: import.meta.env.DEV ? 'development' : 'production' },
    nextTick: (fn: (...args: unknown[]) => void, ...args: unknown[]): void => {
      setTimeout(() => fn(...args), 0);
    },
  };
}
