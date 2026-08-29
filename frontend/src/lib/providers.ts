/**
 * Assembles the MidnightProviders used by the browser frontend.
 *
 * Key differences from the Node-side providers in src/deploy.ts:
 *   - private state  -> levelPrivateStateProvider (IndexedDB via level)
 *   - public data    -> indexerPublicDataProvider with native WebSocket (see note)
 *   - zk artifacts   -> FetchZkConfigProvider with absolute URL + bound fetch (see note)
 *   - proofs         -> dappConnectorProofProvider (in-wallet proving via Lace)
 *                       with fallback to httpClientProofProvider for wallets
 *                       that do not expose a proverServerUri (e.g. 1AM)
 *
 * WebSocket note: indexerPublicDataProvider defaults webSocketImpl to
 * ws.WebSocket from isomorphic-ws. The browser build of isomorphic-ws exports
 * no named WebSocket binding, so the default resolves to undefined, and every
 * subscription (which is how the SDK waits for a transaction to be included)
 * fails silently. Passing the browser's native WebSocket fixes this.
 *
 * FetchZkConfigProvider note: the constructor calls new URL(baseURL) internally.
 * A root-relative path like '/zk' throws "Failed to construct URL: Invalid URL"
 * because it is not an absolute URL. Must use window.location.origin to build
 * an absolute base. The second argument (fetchFunc) must be window.fetch.bind(window)
 * because the provider calls this.fetchFunc(...) internally; a detached fetch
 * reference throws "Illegal invocation" in browsers.
 */
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { dappConnectorProofProvider } from '@midnight-ntwrk/midnight-js-dapp-connector-proof-provider';
import { CostModel } from '@midnight-ntwrk/midnight-js-protocol/ledger';
import type { MidnightProviders, ProofProvider } from '@midnight-ntwrk/midnight-js-types';
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import type { WalletSnapshot } from './lace';
import { createWalletProviders } from './wallet-provider';
import {
  INDEXER_URL,
  INDEXER_WS_URL,
  PROOF_SERVER_URL,
  PROOF_MODE,
  PRIVATE_STATE_PASSWORD,
} from '../config';

/**
 * The ZK artifacts (zkir + proving/verifying keys) are served from /zk by Vite
 * (via public/zk, populated by npm run prepare:contract before dev/build).
 * Must be an absolute URL: FetchZkConfigProvider calls new URL(baseURL) and
 * rejects root-relative paths.
 */
function getZkBaseUrl(): string {
  return `${window.location.origin}/zk`;
}

/**
 * Build the full provider set for a connected Midnight wallet.
 *
 * @param api The connected wallet session (Lace or 1AM).
 * @param snapshot Keys + balances captured at connect time.
 */
export async function createProviders(
  api: ConnectedAPI,
  snapshot: WalletSnapshot,
): Promise<MidnightProviders> {
  // Absolute URL required. window.fetch.bind(window) required to preserve
  // the this-binding when the provider calls this.fetchFunc(...) internally.
  const zkConfigProvider = new FetchZkConfigProvider(
    getZkBaseUrl(),
    window.fetch.bind(window),
  );

  const { walletProvider, midnightProvider } = createWalletProviders(api, snapshot);

  // Proof strategy: default to in-wallet proving (satisfies the challenge
  // spec's "proof generated locally in the browser", no proof server needed).
  // Set VITE_PROOF_MODE=http to delegate proving to the local docker
  // proof-server instead (matches the Level 1 deploy flow).
  //
  // If the wallet does not expose a proverServerUri (as with 1AM),
  // dappConnectorProofProvider internally calls new URL(undefined)
  // and throws "Failed to construct URL: Invalid URL". Detect that
  // case here and fall back to the http proof server instead.
  let proofProvider: ProofProvider;
  if (PROOF_MODE === 'http') {
    proofProvider = httpClientProofProvider(PROOF_SERVER_URL, zkConfigProvider);
  } else {
    let walletSupportsInWalletProving = false;
    try {
      const config = await api.getConfiguration();
      walletSupportsInWalletProving =
        typeof config?.proverServerUri === 'string' &&
        config.proverServerUri.length > 0;
    } catch {
      // getConfiguration() is not available on this wallet.
      walletSupportsInWalletProving = false;
    }

    if (walletSupportsInWalletProving) {
      proofProvider = await dappConnectorProofProvider(
        api,
        zkConfigProvider,
        CostModel.initialCostModel(),
      );
    } else {
      // Wallet does not expose a prover server URI (e.g. 1AM wallet).
      // Fall back to the local http proof server.
      proofProvider = httpClientProofProvider(PROOF_SERVER_URL, zkConfigProvider);
    }
  }

  return {
    privateStateProvider: levelPrivateStateProvider({
      midnightDbName: 'devmatch-midnight',
      privateStateStoreName: 'devmatch-private-state',
      signingKeyStoreName: 'devmatch-signing-keys',
      accountId: snapshot.address,
      privateStoragePasswordProvider: () => PRIVATE_STATE_PASSWORD,
    }),
    // Third argument: browser's native WebSocket. Required because isomorphic-ws
    // browser build exports no named WebSocket binding, so the default
    // webSocketImpl is undefined, and all transaction-inclusion subscriptions fail.
    publicDataProvider: indexerPublicDataProvider(
      INDEXER_URL,
      INDEXER_WS_URL,
      WebSocket as unknown as NonNullable<Parameters<typeof indexerPublicDataProvider>[2]>,
    ),
    zkConfigProvider,
    proofProvider,
    walletProvider,
    midnightProvider,
  };
}
