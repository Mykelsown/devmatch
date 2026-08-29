// @vitest-environment jsdom
/**
 * Unit tests for the createProviders function in lib/providers.ts.
 *
 * Verifies that the proof provider is chosen based on wallet capability:
 * - Wallets with a valid proverServerUri (Lace) use dappConnectorProofProvider
 * - Wallets without proverServerUri (1AM) fall back to httpClientProofProvider
 * - getConfiguration() errors also trigger the http fallback
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import type { WalletSnapshot } from './lace';

// Use vi.hoisted so the class is available in hoisted vi.mock calls.
const { MockFetchZkConfigProvider } = vi.hoisted(() => {
  class MockFetchZkConfigProvider {
    constructor(public _url: string, public _fetch?: typeof fetch) {}
  }
  return { MockFetchZkConfigProvider };
});

// Mock all heavy dependencies
vi.mock('@midnight-ntwrk/midnight-js-level-private-state-provider', () => ({
  levelPrivateStateProvider: vi.fn(() => 'privateStateProvider'),
}));

vi.mock('@midnight-ntwrk/midnight-js-indexer-public-data-provider', () => ({
  indexerPublicDataProvider: vi.fn(() => 'publicDataProvider'),
}));

vi.mock('@midnight-ntwrk/midnight-js-fetch-zk-config-provider', () => ({
  FetchZkConfigProvider: MockFetchZkConfigProvider,
}));

vi.mock('@midnight-ntwrk/midnight-js-http-client-proof-provider', () => ({
  httpClientProofProvider: vi.fn(() => ({ type: 'httpProofProvider' })),
}));

vi.mock('@midnight-ntwrk/midnight-js-dapp-connector-proof-provider', () => ({
  dappConnectorProofProvider: vi.fn(() => ({ type: 'dappConnectorProofProvider' })),
}));

vi.mock('@midnight-ntwrk/midnight-js-protocol/ledger', () => ({
  CostModel: { initialCostModel: vi.fn(() => 'costModel') },
}));

vi.mock('./wallet-provider', () => ({
  createWalletProviders: vi.fn(() => ({
    walletProvider: { type: 'walletProvider' },
    midnightProvider: { type: 'midnightProvider' },
  })),
}));

import { createProviders } from './providers';
import {
  httpClientProofProvider,
} from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import {
  dappConnectorProofProvider,
} from '@midnight-ntwrk/midnight-js-dapp-connector-proof-provider';

// This is the wallet-level snapshot used by providers.ts (from lace.ts).
const SNAPSHOT: WalletSnapshot = {
  address: 't1qqwalletaddress12345',
  coinPublicKey: 'ck',
  encryptionPublicKey: 'ek',
  balances: { tNIGHT: 123n },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createProviders proof strategy', () => {
  it('uses dappConnectorProofProvider when wallet exposes a valid proverServerUri', async () => {
    const fakeApi = {
      getConfiguration: vi.fn().mockResolvedValue({
        proverServerUri: 'http://localhost:9090',
      }),
    } as unknown as ConnectedAPI;

    await createProviders(fakeApi, SNAPSHOT);

    expect(dappConnectorProofProvider).toHaveBeenCalledTimes(1);
    expect(httpClientProofProvider).not.toHaveBeenCalled();
  });

  it('falls back to httpClientProofProvider when proverServerUri is undefined (1AM wallet)', async () => {
    const fakeApi = {
      getConfiguration: vi.fn().mockResolvedValue({
        proverServerUri: undefined,
      }),
    } as unknown as ConnectedAPI;

    await createProviders(fakeApi, SNAPSHOT);

    expect(httpClientProofProvider).toHaveBeenCalledTimes(1);
    expect(dappConnectorProofProvider).not.toHaveBeenCalled();
  });

  it('falls back to httpClientProofProvider when proverServerUri is empty string', async () => {
    const fakeApi = {
      getConfiguration: vi.fn().mockResolvedValue({
        proverServerUri: '',
      }),
    } as unknown as ConnectedAPI;

    await createProviders(fakeApi, SNAPSHOT);

    expect(httpClientProofProvider).toHaveBeenCalledTimes(1);
    expect(dappConnectorProofProvider).not.toHaveBeenCalled();
  });

  it('falls back to httpClientProofProvider when getConfiguration() throws', async () => {
    const fakeApi = {
      getConfiguration: vi.fn().mockRejectedValue(new Error('not implemented')),
    } as unknown as ConnectedAPI;

    await createProviders(fakeApi, SNAPSHOT);

    expect(httpClientProofProvider).toHaveBeenCalledTimes(1);
    expect(dappConnectorProofProvider).not.toHaveBeenCalled();
  });

  it('falls back to httpClientProofProvider when getConfiguration() returns null', async () => {
    const fakeApi = {
      getConfiguration: vi.fn().mockResolvedValue(null),
    } as unknown as ConnectedAPI;

    await createProviders(fakeApi, SNAPSHOT);

    expect(httpClientProofProvider).toHaveBeenCalledTimes(1);
    expect(dappConnectorProofProvider).not.toHaveBeenCalled();
  });
});
