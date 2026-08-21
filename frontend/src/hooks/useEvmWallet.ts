/**
 * useEvmWallet -- EIP-6963 multi-injected provider discovery + fallback.
 *
 * Detects multiple injected wallets (MetaMask, Coinbase Wallet, Phantom, etc.)
 * simultaneously without conflicts, using the EIP-6963 standard. Falls back
 * to window.ethereum if no EIP-6963 providers are found.
 *
 * EIP-6963 flow:
 *   1. Dispatch "eip6963:requestProviders" on window
 *   2. Listen for "eip6963:announceProvider" events from each wallet
 *   3. Each event carries { info: { uuid, name, icon, rdns }, provider }
 *   4. Store all announced providers so the user can choose which to connect
 */
import { useCallback, useEffect, useRef, useState } from 'react';

/** Shape of an EIP-6963 announced provider. */
export interface EvmWalletProvider {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
  provider: unknown; // EIP-1193 provider
}

/** Detect all wallets that announced via EIP-6963. */
function detectEip6963Wallets(): Promise<EvmWalletProvider[]> {
  return new Promise((resolve) => {
    const wallets: EvmWalletProvider[] = [];
    const seen = new Set<string>();

    const handler = (event: Event) => {
      const e = event as CustomEvent<{
        info: { uuid: string; name: string; icon: string; rdns: string };
        provider: unknown;
      }>;
      const { info, provider } = e.detail;
      if (!seen.has(info.uuid)) {
        seen.add(info.uuid);
        wallets.push({
          uuid: info.uuid,
          name: info.name,
          icon: info.icon,
          rdns: info.rdns,
          provider,
        });
      }
    };

    window.addEventListener('eip6963:announceProvider', handler);
    window.dispatchEvent(new CustomEvent('eip6963:requestProviders'));

    // Give wallets 1.5s to announce, then resolve with whatever we found.
    setTimeout(() => {
      window.removeEventListener('eip6963:announceProvider', handler);
      resolve(wallets);
    }, 1500);
  });
}

/** Check window.ethereum as a fallback. */
function detectWindowEthereum(): EvmWalletProvider | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eth: any = (window as any).ethereum;
  if (!eth || typeof eth !== 'object') return null;

  const name =
    (eth.isMetaMask && 'MetaMask') ||
    (eth.isCoinbaseWallet && 'Coinbase Wallet') ||
    (eth.isPhantom && 'Phantom') ||
    (eth.isBraveWallet && 'Brave Wallet') ||
    (eth.isTrust && 'Trust Wallet') ||
    'Browser Wallet';

  const icon =
    (typeof eth.providers === 'object' && Array.isArray(eth.providers)
      ? eth.providers[0]?.icon
      : undefined) || '';

  return {
    uuid: 'window.ethereum',
    name,
    icon,
    rdns: 'window.ethereum',
    provider: eth,
  };
}

/** EIP-1193 provider interface (subset we need). */
interface Eip1193Provider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
}

/**
 * Hook: manage EVM wallet connection via EIP-6963 with fallback.
 *
 * Returns the detected wallets, the connected address/chain, and
 * connect/disconnect/switchChain actions. All event listeners are
 * cleaned up on unmount or provider change.
 */
export function useEvmWallet() {
  const [detectedWallets, setDetectedWallets] = useState<EvmWalletProvider[]>([]);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [provider, setProvider] = useState<unknown>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store the provider ref so event handlers always reference the current one.
  const providerRef = useRef<unknown>(null);

  // Run detection once on mount.
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const eip6963 = await detectEip6963Wallets();
      if (cancelled) return;

      if (eip6963.length > 0) {
        setDetectedWallets(eip6963);
      } else {
        // Fallback: check window.ethereum
        const fallback = detectWindowEthereum();
        if (fallback && !cancelled) {
          setDetectedWallets([fallback]);
        }
      }
    };

    run();
    return () => { cancelled = true; };
  }, []);

  // Subscribe to accountsChanged / chainChanged when a provider is connected.
  useEffect(() => {
    const p = providerRef.current as Eip1193Provider | null;
    if (!p || typeof p.on !== 'function') return;

    const onAccounts = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      setAddress(accounts?.[0] ?? null);
    };

    const onChain = (...args: unknown[]) => {
      const chain = args[0] as string;
      setChainId(typeof chain === 'string' ? chain : String(chain));
    };

    p.on('accountsChanged', onAccounts);
    p.on('chainChanged', onChain);

    return () => {
      if (typeof p.removeListener === 'function') {
        p.removeListener('accountsChanged', onAccounts);
        p.removeListener('chainChanged', onChain);
      }
    };
  }, [provider]);

  const connect = useCallback(async (wallet: EvmWalletProvider) => {
    const p = wallet.provider as Eip1193Provider;
    if (!p || typeof p.request !== 'function') {
      setError('This wallet provider does not support the required methods.');
      return;
    }

    setIsConnecting(true);
    setError(null);
    try {
      const accounts = (await p.request({ method: 'eth_requestAccounts' })) as string[];
      if (accounts && accounts.length > 0) {
        setAddress(accounts[0]);
        setProvider(wallet.provider);
        providerRef.current = wallet.provider;

        // Get chain ID
        const chain = (await p.request({ method: 'eth_chainId' })) as string;
        setChainId(chain);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection rejected');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
    setProvider(null);
    providerRef.current = null;
    setError(null);
  }, []);

  const switchChain = useCallback(async (hexChainId: string) => {
    const p = providerRef.current as Eip1193Provider | null;
    if (!p || typeof p.request !== 'function') return;

    try {
      await p.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      });
    } catch (err) {
      // Some wallets throw 4902 if the chain isn't added. Ignore gracefully.
      if (err instanceof Error && !err.message.includes('4902')) {
        setError(err.message);
      }
    }
  }, []);

  const shortenAddress = useCallback((addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }, []);

  return {
    detectedWallets,
    address,
    chainId,
    provider,
    isConnecting,
    error,
    connect,
    disconnect,
    switchChain,
    shortenAddress,
    isConnected: address !== null,
  };
}
