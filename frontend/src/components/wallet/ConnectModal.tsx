/**
 * ConnectModal -- wallet connection with multiple wallet types.
 *
 * Supports two wallet categories:
 *   1. Midnight wallets (Lace, 1AM) via the Midnight dApp connector API
 *   2. EVM wallets (MetaMask, Coinbase, Phantom, etc.) via EIP-6963
 *
 * Wallet detection is async: extensions inject their APIs after page load.
 * The modal polls on mount and provides a manual refresh button.
 */
import { useEffect, useState, useCallback, type ReactNode } from 'react';
import {
  Check,
  Loader2,
  Laptop,
  Wallet,
  X,
  BadgeCheck,
  Shield,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { GlowButton, GhostButton } from '../ui/primitives';
import { discoverWalletsAsync } from '../../lib/lace';
import { useEvmWallet, type EvmWalletProvider } from '../../hooks/useEvmWallet';
import { NETWORK_ID } from '../../config';
import type { BackendChoice } from '../../lib/wallet-backend';

export function ConnectModal() {
  const { walletModalOpen, setWalletModalOpen, wallet } = useApp();
  const { status, snapshot, choice, choose, connect, disconnect, backend } = wallet;

  const evm = useEvmWallet();

  // Midnight wallet detection state
  const [detectionState, setDetectionState] = useState<'detecting' | 'detected'>('detecting');
  const [laceInstalled, setLaceInstalled] = useState(false);
  const [oneAmInstalled, setOneAmInstalled] = useState(false);

  const runMidnightDetection = useCallback(async () => {
    setDetectionState('detecting');
    const wallets = await discoverWalletsAsync();
    setLaceInstalled(wallets.some((w) => w.rdns?.toLowerCase().includes('lace')));
    setOneAmInstalled(wallets.some((w) => w.rdns?.toLowerCase().includes('1am')));
    setDetectionState('detected');
  }, []);

  useEffect(() => {
    if (!walletModalOpen) return;
    runMidnightDetection();
  }, [walletModalOpen, runMidnightDetection]);

  useEffect(() => {
    if (!walletModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setWalletModalOpen(false);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [walletModalOpen, setWalletModalOpen]);

  if (!walletModalOpen) return null;
  const close = () => setWalletModalOpen(false);

  const isDetecting = detectionState === 'detecting';

  const midnightOptions: {
    key: BackendChoice;
    title: string;
    desc: string;
    available: boolean;
    note?: string;
    icon: ReactNode;
  }[] = [
    {
      key: 'mock',
      title: 'Demo wallet',
      desc: 'Explore the full flow instantly. Simulated wallet, no extension needed.',
      available: true,
      icon: <Laptop size={18} aria-hidden="true" />,
    },
    {
      key: 'lace',
      title: 'Lace',
      desc: `Connect to the ${NETWORK_ID} network through the Lace wallet extension.`,
      available: laceInstalled,
      note: isDetecting ? 'Detecting...' : laceInstalled ? undefined : 'Extension not detected',
      icon: <Wallet size={18} aria-hidden="true" />,
    },
    {
      key: '1am',
      title: '1AM',
      desc: `Connect to the ${NETWORK_ID} network through the 1AM wallet extension.`,
      available: oneAmInstalled,
      note: isDetecting ? 'Detecting...' : oneAmInstalled ? undefined : 'Extension not detected',
      icon: <Shield size={18} aria-hidden="true" />,
    },
  ];

  const handleEvmConnect = async (w: EvmWalletProvider) => {
    await evm.connect(w);
  };

  const isEvmConnected = evm.isConnected;
  const isMidnightConnected = status.kind === 'connected';

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-up rounded-3xl border border-white/10 bg-ink-2/95 p-6 shadow-ticket backdrop-blur-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Connect wallet"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight text-mist">
              Connect wallet
            </h2>
            <p className="mt-1 text-sm text-muted">
              {isMidnightConnected || isEvmConnected
                ? 'Session active on DevMatch.'
                : isDetecting
                  ? 'Detecting installed wallets...'
                  : 'Choose a wallet to connect.'}
            </p>
          </div>
          <button
            onClick={close}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 text-muted transition-colors hover:text-mist"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* -- Midnight Wallet Connected -- */}
        {isMidnightConnected && snapshot && (
          <div className="mt-5 animate-fade-up">
            <div className="flex items-center gap-3 rounded-2xl border border-teal/25 bg-teal/[0.07] p-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-teal-bright text-ink">
                <Check size={20} strokeWidth={3} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-teal-bright">Connected (Midnight)</p>
                <p className="truncate font-mono text-xs text-muted" title={snapshot.address}>
                  {snapshot.address}
                </p>
              </div>
            </div>

            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-faint">Balance</dt>
                <dd className="font-mono font-medium text-mist">{snapshot.balance} tNIGHT</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-faint">Network</dt>
                <dd className="font-mono text-mist">{snapshot.network}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-faint">Mode</dt>
                <dd>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                      backend.mode === 'midnight'
                        ? 'border-teal/40 bg-teal/10 text-teal-bright'
                        : 'border-amber/40 bg-amber/10 text-amber-bright'
                    }`}
                  >
                    <BadgeCheck size={12} aria-hidden="true" />
                    {backend.label}
                  </span>
                </dd>
              </div>
            </dl>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <GhostButton onClick={disconnect}>Disconnect</GhostButton>
              <GlowButton onClick={close}>Done</GlowButton>
            </div>
          </div>
        )}

        {/* -- EVM Wallet Connected -- */}
        {isEvmConnected && !isMidnightConnected && evm.address && (
          <div className="mt-5 animate-fade-up">
            <div className="flex items-center gap-3 rounded-2xl border border-teal/25 bg-teal/[0.07] p-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-teal-bright text-ink">
                <Check size={20} strokeWidth={3} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-teal-bright">Connected (EVM)</p>
                <p className="truncate font-mono text-xs text-muted" title={evm.address}>
                  {evm.shortenAddress(evm.address)}
                </p>
              </div>
            </div>

            {evm.chainId && (
              <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-muted">
                Chain: <span className="font-mono text-mist">{evm.chainId}</span>
              </div>
            )}

            <div className="mt-5 grid grid-cols-2 gap-3">
              <GhostButton onClick={evm.disconnect}>Disconnect</GhostButton>
              <GlowButton onClick={close}>Done</GlowButton>
            </div>
          </div>
        )}

        {/* -- Connecting (Midnight) -- */}
        {status.kind === 'connecting' && (
          <div className="mt-6 flex flex-col items-center py-6 text-center">
            <Loader2 size={34} className="animate-spin text-teal" aria-hidden="true" />
            <p className="mt-4 text-sm font-medium text-mist">
              {backend.mode === 'mock'
                ? 'Opening demo session...'
                : 'Waiting for wallet approval...'}
            </p>
            <p className="mt-1 text-xs text-muted">
              {backend.mode === 'mock'
                ? 'Simulating a connect request'
                : `Approve the request in the wallet popup on ${NETWORK_ID}.`}
            </p>
          </div>
        )}

        {/* -- Connecting (EVM) -- */}
        {evm.isConnecting && (
          <div className="mt-6 flex flex-col items-center py-6 text-center">
            <Loader2 size={34} className="animate-spin text-teal" aria-hidden="true" />
            <p className="mt-4 text-sm font-medium text-mist">Waiting for wallet approval...</p>
            <p className="mt-1 text-xs text-muted">Approve the connection in your wallet popup.</p>
          </div>
        )}

        {/* -- Idle / Error: wallet selection -- */}
        {!isMidnightConnected && !isEvmConnected && status.kind !== 'connecting' && !evm.isConnecting && (
          <div className="mt-5 space-y-6">

            {/* Error messages */}
            {status.kind === 'error' && (
              <p
                role="alert"
                className="rounded-xl border border-red-400/25 bg-red-400/[0.07] p-3 text-xs leading-relaxed text-red-300"
              >
                {status.message}
              </p>
            )}
            {evm.error && (
              <p
                role="alert"
                className="rounded-xl border border-red-400/25 bg-red-400/[0.07] p-3 text-xs leading-relaxed text-red-300"
              >
                {evm.error}
              </p>
            )}

            {/* Midnight wallets */}
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-faint">
                Midnight wallets
              </h3>
              <div className="grid gap-2" role="radiogroup" aria-label="Midnight wallet backend">
                {midnightOptions.map((opt) => {
                  const selected = choice === opt.key || (choice === 'auto' && opt.key === backend.mode);
                  return (
                    <button
                      key={opt.key}
                      role="radio"
                      aria-checked={selected}
                      disabled={!opt.available}
                      onClick={() => choose(opt.key)}
                      className={`flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-all ${
                        selected
                          ? 'border-teal/45 bg-teal/[0.08]'
                          : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                      } ${!opt.available ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      <span
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                          selected ? 'bg-teal text-ink' : 'bg-white/[0.06] text-muted'
                        }`}
                      >
                        {opt.icon}
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-2 text-sm font-semibold text-mist">
                          {opt.title}
                          {!opt.available && opt.note && (
                            <span className="rounded-full border border-amber/40 bg-amber/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-bright">
                              {opt.note}
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                          {opt.desc}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <GlowButton
                className="mt-3 w-full"
                onClick={connect}
                disabled={
                  isDetecting ||
                  !midnightOptions.find(
                    (o) => o.key === choice || (choice === 'auto' && o.key === backend.mode),
                  )?.available
                }
              >
                <Wallet size={16} aria-hidden="true" />
                {isDetecting ? 'Detecting wallets...' : 'Connect Midnight wallet'}
              </GlowButton>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-[11px] font-medium text-faint">or</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            {/* EVM wallets (EIP-6963) */}
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-faint">
                EVM wallets (EIP-6963)
              </h3>
              {evm.detectedWallets.length > 0 ? (
                <div className="grid gap-2">
                  {evm.detectedWallets.map((w) => (
                    <button
                      key={w.uuid}
                      onClick={() => handleEvmConnect(w)}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-3.5 text-left transition-all hover:border-white/20 hover:bg-white/[0.04]"
                    >
                      {w.icon ? (
                        <img
                          src={w.icon}
                          alt=""
                          className="h-9 w-9 shrink-0 rounded-full"
                        />
                      ) : (
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/[0.06] text-muted">
                          <Wallet size={16} />
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-mist">{w.name}</span>
                        <span className="block text-xs text-muted">Click to connect</span>
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 p-4 text-center">
                  <p className="text-xs text-muted">
                    No EVM wallets detected. Install{' '}
                    <a
                      href="https://metamask.io/download/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-teal transition-colors hover:text-teal-bright"
                    >
                      MetaMask
                    </a>{' '}
                    or another Web3 wallet.
                  </p>
                </div>
              )}
            </div>

            {/* Refresh detection button */}
            <button
              onClick={() => {
                runMidnightDetection();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs font-medium text-muted transition-colors hover:border-teal/30 hover:text-teal-bright"
            >
              <RefreshCw size={12} aria-hidden="true" />
              Refresh wallet detection
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
