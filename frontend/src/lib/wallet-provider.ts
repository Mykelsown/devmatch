/**
 * Bridges the Lace dApp connector API (ConnectedAPI) to the
 * midnight-js WalletProvider and MidnightProvider interfaces.
 *
 * The connector API works with serialized hex-string transactions.
 * midnight-js works with ledger WASM objects. This adapter converts between
 * the two on every call, using the SDK's fromHex/toHex utilities which handle
 * the exact byte layout the connector and WASM runtime expect.
 */
import {
  Transaction,
  type FinalizedTransaction,
  type TransactionId,
  type CoinPublicKey,
  type EncPublicKey,
} from '@midnight-ntwrk/midnight-js-protocol/ledger';
import type {
  WalletProvider,
  MidnightProvider,
  UnboundTransaction,
} from '@midnight-ntwrk/midnight-js-types';
import { fromHex, toHex } from '@midnight-ntwrk/midnight-js-utils';
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import type { WalletSnapshot } from './lace';

/**
 * Build the midnight-js wallet and midnight providers from a connected wallet API.
 *
 * The shielded coin/encryption keys are captured once at connect time because
 * the WalletProvider interface in midnight-js 4.1.x declares getCoinPublicKey
 * and getEncryptionPublicKey as synchronous, while the connector only exposes
 * them via the async getShieldedAddresses().
 */
export function createWalletProviders(
  api: ConnectedAPI,
  snapshot: WalletSnapshot,
): {
  walletProvider: WalletProvider;
  midnightProvider: MidnightProvider;
} {
  const walletProvider: WalletProvider = {
    getCoinPublicKey: (): CoinPublicKey => snapshot.coinPublicKey,
    getEncryptionPublicKey: (): EncPublicKey => snapshot.encryptionPublicKey,

    balanceTx: async (tx: UnboundTransaction): Promise<FinalizedTransaction> => {
      // toHex from midnight-js-utils produces the exact hex encoding the
      // connector expects. The hand-rolled bytesToHex used previously differed
      // subtly, causing Transaction.deserialize to fail with a WASM type error.
      const { tx: balanced } = await api.balanceUnsealedTransaction(
        toHex(tx.serialize()),
        { payFees: true },
      );
      // The wallet returns a sealed transaction: SignatureEnabled, Proof,
      // Binding all applied. fromHex is the inverse of toHex.
      return Transaction.deserialize(
        'signature',
        'proof',
        'binding',
        fromHex(balanced),
      ) as FinalizedTransaction;
    },
  };

  const midnightProvider: MidnightProvider = {
    submitTx: async (tx: FinalizedTransaction): Promise<TransactionId> => {
      // identifiers() is the safe value for tracking a specific transaction.
      // transactionHash() is explicitly not safe because merging can change it.
      // Throw rather than silently return an untrackable id.
      const [transactionId] = tx.identifiers();
      if (transactionId === undefined) {
        throw new Error(
          'Balanced transaction carried no identifiers and cannot be tracked.',
        );
      }
      await api.submitTransaction(toHex(tx.serialize()));
      return transactionId;
    },
  };

  return { walletProvider, midnightProvider };
}
