/**
 * Frontend network configuration.
 *
 * Defaults target the deployed contract on Preview. All values can be
 * overridden with Vite env vars (see `.env.example`).
 */

export const NETWORK_ID: string = import.meta.env.VITE_NETWORK_ID ?? 'preview';

/** Deployed DevMatch `dev_profile` contract address (Preview). */
export const CONTRACT_ADDRESS: string =
  import.meta.env.VITE_CONTRACT_ADDRESS ??
  '2ea2f4d440cbffb41e95efeda584cf8df2cdad82997549389e7ebcf9d1f17db5';

export const INDEXER_URL: string =
  import.meta.env.VITE_INDEXER_URL ?? 'https://indexer.preview.midnight.network/api/v4/graphql';

export const INDEXER_WS_URL: string =
  import.meta.env.VITE_INDEXER_WS_URL ??
  'wss://indexer.preview.midnight.network/api/v4/graphql/ws';

/**
 * Local Midnight proof server (docker). Point this at a hosted proof server
 * when deploying the frontend to a public URL.
 */
export const PROOF_SERVER_URL: string =
  import.meta.env.VITE_PROOF_SERVER_URL ?? 'http://127.0.0.1:6300';

/** Where the ZK artifacts (zkir + keys) are served from (Vite public dir). */
export const ZK_BASE_URL: string = '/zk';

/**
 * Private state password for the browser private state store.
 * The SDK requires >= 16 chars with 3 of 4 character classes.
 * This is a demo credential — override with a strong secret in production.
 */
export const PRIVATE_STATE_PASSWORD: string = 'DevMatch-Browser-State-2026!';

/** Identifier for this contract's private state in the browser store. */
export const PRIVATE_STATE_ID: string = 'devmatch-private-state';
