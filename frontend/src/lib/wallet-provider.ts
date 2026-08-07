/**
 * Bridges the Lace dApp connector API (`ConnectedAPI`) to the
 * midnight-js `WalletProvider` and `MidnightProvider` interfaces.
 *
 * Lace's ConnectedAPI works with *serialized* transactions (hex strings), while
 * midnight-js works with ledger transaction objects. This adapter:
 *   - exposes the wallet's shielded coin/encryption public keys (cached at
 *     connect time — the 4.1.x `WalletProvider` interface requires synchronous
 *     key getters, so we cannot resolve them lazily from a Promise),
 *   - delegates balancing to the wallet (`balanceUnsealedTransaction`),
 *   - delegates submission to the wallet (`submitTransaction`).
 *
 * Serialization format: Lace expects hex strings of the serialized ledger
 * `Transaction`. `balanceUnsealedTransaction` takes
 * `Transaction<SignatureEnabled, Proof, PreBinding>` (an unbound tx, exactly
 * what midnight-js passes to `balanceTx`) and returns
 * `Transaction<SignatureEnabled, Proof, Binding>` (a finalized tx, exactly
 * what the `FinalizedTransaction` type expects back).
 */
import {
  Transaction,
  type FinalizedTransaction,
} from '@midnight-ntwrk/midnight-js-protocol/ledger';
import type {
  WalletProvider,
  MidnightProvider,
  UnboundTransaction,
} from '@midnight-ntwrk/midnight-js-types';
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import type { WalletSnapshot } from './lace';

/** Hex-encode bytes. */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Hex-decode a string into bytes. */
function hexToBytes(hex: string): Uint8Array {
  const clean = hex.length % 2 === 0 ? hex : `0${hex}`;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

/**
 * Build the midnight-js wallet + midnight providers from a connected Lace API.
 *
 * @param api The connected Lace session.
 * @param snapshot Keys and balances captured once at connect time. The
 *   shielded coin/encryption keys MUST be cached here: the `WalletProvider`
 *   interface in midnight-js 4.1.x declares `getCoinPublicKey` /
 *   `getEncryptionPublicKey` as synchronous, while Lace only exposes them via
 *   the async `getShieldedAddresses()`.
 */
export function createWalletProviders(
  api: ConnectedAPI,
  snapshot: WalletSnapshot,
): {
  walletProvider: WalletProvider;
  midnightProvider: MidnightProvider;
} {
  const walletProvider: WalletProvider = {
    // Synchronous key getters backed by the connect-time snapshot.
    getCoinPublicKey: () => snapshot.coinPublicKey,
    getEncryptionPublicKey: () => snapshot.encryptionPublicKey,
    balanceTx: async (tx: UnboundTransaction) => {
      const serialized = bytesToHex(tx.serialize());
      const { tx: balancedSerialized } = await api.balanceUnsealedTransaction(
        serialized,
        { payFees: true },
      );
      // Ledger markers: 'signature' / 'proof' / 'binding' identify the
      // SignatureEnabled / Proof / Binding variants the wallet returned.
      return Transaction.deserialize(
        'signature',
        'proof',
        'binding',
        hexToBytes(balancedSerialized),
      ) as FinalizedTransaction;
    },
  };

  const midnightProvider: MidnightProvider = {
    submitTx: async (tx: FinalizedTransaction) => {
      await api.submitTransaction(bytesToHex(tx.serialize()));
      // The wallet API returns void; derive a watchable id from the tx itself
      // so the framework's `watchForTxData(txId)` can track finalization.
      const ids = tx.identifiers();
      return ids[0] ?? tx.transactionHash();
    },
  };

  return { walletProvider, midnightProvider };
}
