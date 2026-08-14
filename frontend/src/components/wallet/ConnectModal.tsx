/**
 * ConnectModal — wallet connection with clear states:
 * idle (choose backend) → connecting → connected (truncated address pill).
 *
 * Backend choice: the demo wallet works anywhere; Lace · Midnight is offered
 * when the extension is installed and drives the real on-chain flow.
 */
import { useEffect, type ReactNode } from 'react';
import { Check, Loader2, Laptop, Wallet, X, BadgeCheck } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { GlowButton, GhostButton } from '../ui/primitives';
import { detectLace } from '../../lib/lace';
import { NETWORK_ID } from '../../config';
import type { BackendChoice } from '../../lib/wallet-backend';

export function ConnectModal() {
  const { walletModalOpen, setWalletModalOpen, wallet } = useApp();
  const { status, snapshot, choice, choose, connect, disconnect, backend } = wallet;

  const laceInstalled = detectLace() !== undefined;

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

  const options: {
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
      key: 'midnight',
      title: 'Lace · Midnight',
      desc: `Connect the real ${NETWORK_ID} network through the Lace extension.`,
      available: laceInstalled,
      note: laceInstalled ? undefined : 'Extension not detected',
      icon: <Wallet size={18} aria-hidden="true" />,
    },
  ];

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className="w-full max-w-md animate-fade-up rounded-3xl border border-white/10 bg-ink-2/95 p-6 shadow-ticket backdrop-blur-2xl"
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
              {status.kind === 'connected'
                ? 'Session active on the DevMatch network.'
                : 'Choose how you want to connect.'}
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

        {/* Connected */}
        {status.kind === 'connected' && snapshot && (
          <div className="mt-5 animate-fade-up">
            <div className="flex items-center gap-3 rounded-2xl border border-teal/25 bg-teal/[0.07] p-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-teal-bright text-ink">
                <Check size={20} strokeWidth={3} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-teal-bright">Connected</p>
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

            {backend.mode === 'mock' && (
              <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs leading-relaxed text-muted">
                Demo session — registration simulates proof generation and the
                ledger write. Install Lace to commit on the real Midnight
                network.
              </p>
            )}

            <div className="mt-5 grid grid-cols-2 gap-3">
              <GhostButton onClick={disconnect}>Disconnect</GhostButton>
              <GlowButton onClick={close}>Done</GlowButton>
            </div>
          </div>
        )}

        {/* Connecting */}
        {status.kind === 'connecting' && (
          <div className="mt-6 flex flex-col items-center py-6 text-center">
            <Loader2 size={34} className="animate-spin text-teal" aria-hidden="true" />
            <p className="mt-4 text-sm font-medium text-mist">
              {backend.mode === 'mock'
                ? 'Opening demo session…'
                : 'Waiting for wallet approval…'}
            </p>
            <p className="mt-1 text-xs text-muted">
              {backend.mode === 'mock'
                ? 'Simulating a connect request'
                : `Approve the request in the Lace popup on ${NETWORK_ID}.`}
            </p>
          </div>
        )}

        {/* Idle / error */}
        {(status.kind === 'idle' || status.kind === 'error') && (
          <div className="mt-5">
            <div className="grid gap-2.5" role="radiogroup" aria-label="Wallet backend">
              {options.map((opt) => {
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
                        {!opt.available && (
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

            {status.kind === 'error' && (
              <p
                role="alert"
                className="mt-3 rounded-xl border border-red-400/25 bg-red-400/[0.07] p-3 text-xs leading-relaxed text-red-300"
              >
                {status.message}
              </p>
            )}

            {!laceInstalled && (
              <p className="mt-3 text-xs leading-relaxed text-faint">
                Lace not detected?{' '}
                <a
                  href="https://chromewebstore.google.com/detail/lace/afkphoeejbbklcjcagepaknnnmjjkkff"
                  target="_blank"
                  rel="noreferrer"
                  className="text-teal transition-colors hover:text-teal-bright"
                >
                  Install the Lace extension ↗
                </a>{' '}
                to connect to the real Midnight network.
              </p>
            )}

            <GlowButton
              className="mt-5 w-full"
              onClick={connect}
              disabled={!options.find((o) => o.key === choice || (choice === 'auto' && o.key === backend.mode))?.available}
            >
              <Wallet size={16} aria-hidden="true" />
              Connect
            </GlowButton>
          </div>
        )}
      </div>
    </div>
  );
}
