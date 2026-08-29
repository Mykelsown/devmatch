/**
 * Frontend network configuration.
 *
 * Defaults target the deployed contract on Preview. All values can be
 * overridden with Vite env vars (see `.env.example`).
 */

export const NETWORK_ID: string = import.meta.env.VITE_NETWORK_ID ?? 'preview';

/**
 * GitHub OAuth configuration for Green tier verification.
 * Register a GitHub OAuth App at:
 * https://github.com/settings/applications/new
 * - Homepage URL: Your deployed app URL (e.g., https://devmatch.vercel.app)
 * - Authorization callback URL: Your deployed app URL + /auth/callback
 */
export const GITHUB_CLIENT_ID: string = import.meta.env.VITE_GITHUB_CLIENT_ID ?? '';

/**
 * Where GitHub redirects after OAuth (must match the OAuth App callback URL).
 * Lazily evaluated to avoid breaking in test environments where window
 * is not available.
 */
export function getGitHubRedirectUri(): string {
  if (import.meta.env.VITE_GITHUB_REDIRECT_URI) {
    return import.meta.env.VITE_GITHUB_REDIRECT_URI;
  }
  if (typeof window !== 'undefined') {
    // Include the hash fragment so the router restores the register view
    // when GitHub redirects back. Without this, the app boots at the root
    // and the callback code is never processed.
    return `${window.location.origin}/auth/callback`;
  }
  return 'http://localhost:5173/auth/callback';
}

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

/**
 * How proofs are generated: 'wallet' (default, in-wallet proving via Lace) or
 * 'http' (local docker proof server, matches the Level 1 deploy flow).
 */
export const PROOF_MODE: 'wallet' | 'http' =
  import.meta.env.VITE_PROOF_MODE === 'http' ? 'http' : 'wallet';

/**
 * Attester service base URL (Level 3 prep). The GitHub OAuth button redirects
 * here; the returned `attestedProfileHash` is stored client-side.
 */
export const ATTESTER_URL: string =
  import.meta.env.VITE_ATTESTER_URL ?? 'http://localhost:3001';

/**
 * Private state password for the browser private state store.
 * The SDK requires >= 16 chars with 3 of 4 character classes.
 * This is a demo credential — override with a strong secret in production.
 */
export const PRIVATE_STATE_PASSWORD: string = 'DevMatch-Browser-State-2026!';

/** Identifier for this contract's private state in the browser store. */
export const PRIVATE_STATE_ID: string = 'devmatch-private-state';
