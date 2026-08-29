/**
 * Assembles the `MidnightProviders` used by the browser frontend.
 *
 * All providers here are browser-compatible:
 *   - private state  -> `levelPrivateStateProvider` (IndexedDB via `level`)
 *   - public data    -> `indexerPublicDataProvider` (GraphQL + WS)
 *   - zk artifacts   -> `FetchZkConfigProvider` (served from /zk)
 *   - proofs         -> in-wallet proving via the Lace dApp connector
 *                       (`dappConnectorProofProvider`), or the local docker
 *                       proof server (`httpClientProofProvider`) when
 *                       `VITE_PROOF_MODE=http`.
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
  ZK_BASE_URL,
  PROOF_SERVER_URL,
  PROOF_MODE,
  PRIVATE_STATE_PASSWORD,
} from '../config';

/**
 * Build the full provider set for a connected Lace wallet.
 *
 * @param api The connected Lace session.
 * @param snapshot Keys + balances captured at connect time (required by the
 *   wallet provider bridge, see `lib/wallet-provider.ts`).
 */
export async function createProviders(
  api: ConnectedAPI,
  snapshot: WalletSnapshot,
): Promise<MidnightProviders> {
  // ZK artifacts (zkir + proving/verifying keys) are copied into
  // `public/zk` by `npm run prepare:contract` (runs before dev/build).
  const zkConfigProvider = new FetchZkConfigProvider(ZK_BASE_URL);

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
    publicDataProvider: indexerPublicDataProvider(INDEXER_URL, INDEXER_WS_URL),
    zkConfigProvider,
    proofProvider,
    walletProvider,
    midnightProvider,
  };
}
