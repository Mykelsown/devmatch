/**
 * Wallet integration via the Midnight dApp connector API.
 *
 * Wallets inject their `InitialAPI` under `window.midnight`, keyed by
 * a UUID chosen by the extension. We iterate all values and identify
 * wallets by their `rdns` field (e.g. "io.hot-lace.dev" for Lace).
 *
 * The extension API injects asynchronously after page load. Sync detection
 * (`discoverWallets`) may return an empty array if called before injection.
 * Use `discoverWalletsAsync` for reliable detection with polling.
 */
import type { ConnectedAPI, InitialAPI } from '@midnight-ntwrk/dapp-connector-api';

/** Supported wallet types. */
export type WalletType = 'lace' | '1am';

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

/* ── Discovery: iterate window.midnight, match by rdns ──────────────────── */

/**
 * Discover all injected Midnight wallets by iterating the namespace.
 * Do NOT look up by key name: extension keys are not guaranteed.
 */
function discoverWallets(): InitialAPI[] {
  return Object.values((window as any).midnight ?? {});
}

/**
 * Find a wallet matching a specific type hint (lace or 1am).
 * Falls back to undefined if no rdns match.
 */
function findWalletByType(walletType: WalletType): InitialAPI | undefined {
  const wallets = discoverWallets();
  const keyword = walletType === 'lace' ? 'lace' : '1am';
  return wallets.find((w) => w.rdns?.toLowerCase().includes(keyword));
}

/**
 * Poll window.midnight for any Midnight wallet.
 * Extensions inject asynchronously after page load.
 */
export async function discoverWalletsAsync(
  { maxAttempts = 10, intervalMs = 300 }: { maxAttempts?: number; intervalMs?: number } = {},
): Promise<InitialAPI[]> {
  for (let i = 0; i < maxAttempts; i++) {
    const found = discoverWallets();
    if (found.length > 0) return found;
    if (i < maxAttempts - 1) {
      await new Promise<void>((resolve) => setTimeout(resolve, intervalMs));
    }
  }
  return [];
}

/**
 * Connect to a wallet on the given network.
 * Throws a `WalletError` with a friendly `kind` for the UI to display.
 */
export async function connectWallet(
  networkId: string,
  walletType: WalletType,
): Promise<ConnectedAPI> {
  const walletName = walletType === 'lace' ? 'Lace' : '1AM';

  // Try synchronous discovery first, then fall back to async polling.
  let walletApi = findWalletByType(walletType);
  if (!walletApi) {
    const wallets = await discoverWalletsAsync();
    const keyword = walletType === 'lace' ? 'lace' : '1am';
    walletApi = wallets.find((w) => w.rdns?.toLowerCase().includes(keyword));
  }

  if (!walletApi) {
    throw new WalletError(
      'not-installed',
      `${walletName} wallet not detected. Install the ${walletName} extension and refresh this page.`,
    );
  }

  try {
    const api = await walletApi.connect(networkId);

    // Verify the wallet is actually on the network we asked for.
    const connectionStatus = await api.getConnectionStatus();
    if (connectionStatus.status === 'connected' && connectionStatus.networkId !== networkId) {
      const detected = connectionStatus.networkId || 'unknown';
      const friendlyNames: Record<string, string> = {
        preview: 'Preview',
        preprod: 'Preprod',
        mainnet: 'Mainnet',
      };
      const detectedLabel = friendlyNames[detected] ?? detected;
      const requiredLabel = friendlyNames[networkId] ?? networkId;
      throw new WalletError(
        'network-mismatch',
        `Your wallet is set to ${detectedLabel}. Switch to ${requiredLabel} in your ${walletName} wallet settings.`,
      );
    }

    // Hint usage with typeof guard (Lace 4.0.1 compatibility:
    // Lace declares hintUsage as own property with value undefined,
    // so 'hintUsage in api' would pass but then throw).
    if (typeof api.hintUsage === 'function') {
      await api.hintUsage([
        'getShieldedAddresses',
        'getProvingProvider',
        'balanceUnsealedTransaction',
        'submitTransaction',
      ]);
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

/** Detect whether a specific wallet is installed (synchronous snapshot). */
export function detectWallet(walletType: WalletType): InitialAPI | undefined {
  const keyword = walletType === 'lace' ? 'lace' : '1am';
  return discoverWallets().find((w) => w.rdns?.toLowerCase().includes(keyword));
}

/**
 * Async wallet detection with polling.
 * The Midnight dApp connector API injects wallets asynchronously after page load.
 * Polls up to maxAttempts times before returning undefined.
 */
export async function detectWalletAsync(
  walletType: WalletType,
  { maxAttempts = 10, intervalMs = 200 }: { maxAttempts?: number; intervalMs?: number } = {},
): Promise<InitialAPI | undefined> {
  for (let i = 0; i < maxAttempts; i++) {
    const api = detectWallet(walletType);
    if (api) return api;
    if (i < maxAttempts - 1) {
      await new Promise<void>((resolve) => setTimeout(resolve, intervalMs));
    }
  }
  return undefined;
}

/** Check if any Midnight wallet is installed (synchronous snapshot). */
export function detectAnyWallet(): WalletType[] {
  const installed: WalletType[] = [];
  if (detectWallet('lace')) installed.push('lace');
  if (detectWallet('1am')) installed.push('1am');
  return installed;
}

/** Async detection for all wallets. Returns installed wallet types. */
export async function detectAnyWalletAsync(
  opts?: { maxAttempts?: number; intervalMs?: number },
): Promise<WalletType[]> {
  const results = await Promise.all([
    detectWalletAsync('lace', opts),
    detectWalletAsync('1am', opts),
  ]);
  const installed: WalletType[] = [];
  if (results[0]) installed.push('lace');
  if (results[1]) installed.push('1am');
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
