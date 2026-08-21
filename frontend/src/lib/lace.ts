/**
 * Wallet integration via the Midnight dApp connector API.
 *
 * Both Lace and 1AM wallets inject their `InitialAPI` at
 * `window.midnight[WALLET_ID]`. We call `connect(networkId)` to get
 * a `ConnectedAPI` for the wallet session.
 */
import type { ConnectedAPI, InitialAPI } from '@midnight-ntwrk/dapp-connector-api';

/** Wallet IDs registered under `window.midnight`. */
export const LACE_WALLET_ID = 'mnLace';
export const ONAM_WALLET_ID = 'mn1am';

/** Supported wallet types. */
export type WalletType = 'lace' | '1am';

/** Map wallet type to its window.midnight key. */
export const WALLET_IDS: Record<WalletType, string> = {
  lace: LACE_WALLET_ID,
  '1am': ONAM_WALLET_ID,
};

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
 * Connect to a wallet on the given network.
 * Throws a `WalletError` with a friendly `kind` for the UI to display.
 */
export async function connectWallet(networkId: string, walletType: WalletType): Promise<ConnectedAPI> {
  const walletApi = detectWallet(walletType);
  const walletName = walletType === 'lace' ? 'Lace' : '1AM';
  if (!walletApi) {
    throw new WalletError(
      'not-installed',
      `${walletName} wallet not detected. Install the ${walletName} extension and refresh this page.`,
    );
  }

  try {
    const api = await walletApi.connect(networkId);

    // Confirm the wallet is actually on the network we asked for.
    const config = await api.getConfiguration();
    if (config.networkId !== networkId) {
      throw new WalletError(
        'network-mismatch',
        `Wallet is connected to "${config.networkId}", but this app needs "${networkId}". Switch networks in ${walletName} and reconnect.`,
      );
    }
    return api;
  } catch (err) {
    if (err instanceof WalletError) throw err;
    // Wallet rejects the connect promise when the user dismisses the dialog.
    if (err instanceof Error && /reject|denied|dismiss|user/gi.test(err.message)) {
      throw new WalletError('user-rejected', 'Connection request rejected in the wallet.');
    }
    throw new WalletError('unknown', err instanceof Error ? err.message : String(err));
  }
}

/** Detect whether a specific wallet is installed. */
export function detectWallet(walletType: WalletType): InitialAPI | undefined {
  const walletId = WALLET_IDS[walletType];
  return window.midnight?.[walletId];
}

/** Check if any Midnight wallet is installed. */
export function detectAnyWallet(): WalletType[] {
  const installed: WalletType[] = [];
  if (detectWallet('lace')) installed.push('lace');
  if (detectWallet('1am')) installed.push('1am');
  return installed;
}

/** Get wallet display info for UI. */
export function getWalletInfo(walletType: WalletType): { name: string; description: string; installed: boolean } {
  const installed = detectWallet(walletType) !== undefined;
  const walletName = walletType === 'lace' ? 'Lace' : '1AM';
  return {
    name: walletName,
    description: installed
      ? `Connect to the real Midnight network via ${walletName}.`
      : `${walletName} extension not detected`,
    installed,
  };
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
