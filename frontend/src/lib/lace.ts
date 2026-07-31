/**
 * Lace wallet integration via the Midnight dApp connector API.
 *
 * Lace injects its `InitialAPI` at `window.midnight.mnLace`. We call
 * `connect(networkId)` to get a `ConnectedAPI` for the wallet session.
 */
import type { ConnectedAPI, InitialAPI } from '@midnight-ntwrk/dapp-connector-api';

/** The wallet id Lace registers under `window.midnight`. */
export const LACE_WALLET_ID = 'mnLace';

export type WalletErrorKind =
  | 'not-installed'
  | 'user-rejected'
  | 'network-mismatch'
  | 'unknown';

export class WalletError extends Error {
  readonly kind: WalletErrorKind;

  constructor(kind: WalletErrorKind, message: string) {
    super(message);
    this.name = 'WalletError';
    this.kind = kind;
  }
}

/** Detect whether the Lace wallet is installed and exposes the dApp connector. */
export function detectLace(): InitialAPI | undefined {
  return window.midnight?.[LACE_WALLET_ID];
}

/**
 * Connect to Lace on the given network.
 * Throws a `WalletError` with a friendly `kind` for the UI to display.
 */
export async function connectLace(networkId: string): Promise<ConnectedAPI> {
  const lace = detectLace();
  if (!lace) {
    throw new WalletError(
      'not-installed',
      'Lace wallet not detected. Install the Lace extension and refresh this page.',
    );
  }

  try {
    const api = await lace.connect(networkId);

    // Confirm the wallet is actually on the network we asked for.
    const config = await api.getConfiguration();
    if (config.networkId !== networkId) {
      throw new WalletError(
        'network-mismatch',
        `Wallet is connected to "${config.networkId}", but this app needs "${networkId}". Switch networks in Lace and reconnect.`,
      );
    }
    return api;
  } catch (err) {
    if (err instanceof WalletError) throw err;
    // Lace rejects the connect promise when the user dismisses the dialog.
    if (err instanceof Error && /reject|denied|dismiss|user/gi.test(err.message)) {
      throw new WalletError('user-rejected', 'Connection request rejected in the wallet.');
    }
    throw new WalletError('unknown', err instanceof Error ? err.message : String(err));
  }
}

export interface WalletSnapshot {
  address: string;
  coinPublicKey: string;
  encryptionPublicKey: string;
  balances: Record<string, bigint>;
}

/** Pull the address, shielded keys, and balances from a connected wallet. */
export async function readWalletSnapshot(api: ConnectedAPI): Promise<WalletSnapshot> {
  const [{ unshieldedAddress }, shielded, unshieldedBalances] = await Promise.all([
    api.getUnshieldedAddress(),
    api.getShieldedAddresses(),
    api.getUnshieldedBalances(),
  ]);
  return {
    address: unshieldedAddress,
    coinPublicKey: shielded.shieldedCoinPublicKey,
    encryptionPublicKey: shielded.shieldedEncryptionPublicKey,
    balances: unshieldedBalances,
  };
}

/** Format a bigint balance with separators. */
export function formatBalance(value: bigint): string {
  return value.toLocaleString('en-US');
}
