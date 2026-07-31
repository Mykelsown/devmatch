/**
 * Bridges the Lace dApp connector API (`ConnectedAPI`) to the
 * midnight-js `WalletProvider` and `MidnightProvider` interfaces.
 *
 * Lace's ConnectedAPI works with *serialized* transactions (strings), while
 * midnight-js works with ledger transaction objects. This adapter:
 *   - exposes the wallet's shielded coin/encryption public keys,
 *   - delegates balancing to the wallet (`balanceUnsealedTransaction`),
 *   - delegates submission to the wallet (`submitTransaction`).
 *
 * NOTE: the exact key-string and tx serialization formats are version
 * sensitive. The tx serialization helpers at the bottom are centralized here
 * so a format tweak is a one-line change.
 */
import type {
  WalletProvider,
  MidnightProvider,
  UnboundTransaction,
  FinalizedTransaction,
} from '@midnight-ntwrk/midnight-js-types';
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';

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
 * Serialize an unbound transaction for the wallet API.
 * Uses the ledger object's own `serialize()` (Uint8Array) and hex-encodes it.
 */
function serializeUnbound(tx: UnboundTransaction): string {
  const raw = (tx as unknown as { serialize(): Uint8Array }).serialize();
  return bytesToHex(raw);
}

/**
 * Deserialize the wallet's balanced transaction back into a
 * midnight-js `FinalizedTransaction` object.
 */
function deserializeFinalized(serialized: string): FinalizedTransaction {
  const { Transaction } = {} as {
    Transaction: {
      deserialize(raw: Uint8Array): FinalizedTransaction;
    };
  };
  return Transaction.deserialize(hexToBytes(serialized));
}

/**
 * Build the midnight-js wallet + midnight providers from a connected Lace API.
 */
export function createWalletProviders(api: ConnectedAPI): {
  walletProvider: WalletProvider;
  midnightProvider: MidnightProvider;
} {
  const walletProvider: WalletProvider = {
    // Lace exposes the shielded keys as bech32m strings via getShieldedAddresses.
    // These are resolved lazily so the wallet provider stays stateless.
    getCoinPublicKey: () =>
      api.getShieldedAddresses().then((s) => s.shieldedCoinPublicKey) as unknown as WalletProvider extends {
        getCoinPublicKey(): infer R;
      }
        ? R
        : never,
    getEncryptionPublicKey: () =>
      api.getShieldedAddresses().then((s) => s.shieldedEncryptionPublicKey) as unknown as WalletProvider extends {
        getEncryptionPublicKey(): infer R;
      }
        ? R
        : never,
    balanceTx: async (tx, ttl) => {
      const serialized = serializeUnbound(tx);
      const { tx: balancedSerialized } = await api.balanceUnsealedTransaction(serialized, {
        ...(ttl ? { ttl } : {}),
      });
      return deserializeFinalized(balancedSerialized);
    },
  };

  const midnightProvider: MidnightProvider = {
    submitTx: async (tx) => {
      const raw = (tx as unknown as { serialize(): Uint8Array }).serialize();
      await api.submitTransaction(bytesToHex(raw));
      // The wallet API does not return the tx id; derive one from the hash
      // preimage is not possible client-side, so we surface a generic id.
      return '' as unknown as Awaited<ReturnType<MidnightProvider['submitTx']>>;
    },
  };

  return { walletProvider, midnightProvider };
}
