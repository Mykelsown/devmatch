/**
 * TopBar — full-width top bar for the authenticated dashboard area.
 *
 * Contains: DevMatch logo left, search/filter input center (pill-shaped),
 * notification bell and user avatar pill right (truncated wallet address).
 */
import { Bell, Search, Wallet } from 'lucide-react';
import { useApp } from '../../state/AppContext';

export function TopBar() {
  const { wallet, setWalletModalOpen } = useApp();
  const { status, snapshot } = wallet;

  const displayAddress =
    status.kind === 'connected' && snapshot
      ? `${snapshot.address.slice(0, 6)}...${snapshot.address.slice(-4)}`
      : null;

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-white/[0.06] bg-surface/80 px-6 backdrop-blur-xl">
      {/* Logo (hidden on smaller screens since sidebar has the icon) */}
      <div className="hidden items-center gap-2 lg:flex">
        <span className="font-display text-lg font-bold tracking-tight text-mist">
          Dev<span className="text-teal-bright">Match</span>
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search / filter pill */}
      <div className="relative hidden max-w-sm flex-1 sm:block">
        <Search
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          aria-hidden="true"
        />
        <input
          type="text"
          placeholder="Search developers or requirements..."
          className="w-full rounded-full border border-white/[0.08] bg-white/[0.03] py-2 pl-10 pr-4 text-sm text-mist placeholder:text-muted focus:border-teal/30 focus:outline-none focus:ring-1 focus:ring-teal/20"
        />
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Notification bell */}
      <button
        className="relative grid h-9 w-9 place-items-center rounded-full border border-white/[0.06] text-muted transition-colors hover:bg-white/[0.04] hover:text-mist"
        aria-label="Notifications"
      >
        <Bell size={17} aria-hidden="true" />
        {/* Notification dot */}
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-terracotta" />
      </button>

      {/* User avatar pill */}
      <button
        onClick={() => setWalletModalOpen(true)}
        className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 transition-colors hover:bg-white/[0.06]"
        aria-label={displayAddress ? `Wallet: ${displayAddress}. Open wallet panel.` : 'Connect wallet'}
      >
        {status.kind === 'connected' && displayAddress ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="pulse-dot absolute inline-flex h-2 w-2 rounded-full bg-teal-bright" />
            </span>
            <span className="font-mono text-xs font-medium text-mist">{displayAddress}</span>
          </>
        ) : (
          <>
            <Wallet size={15} className="text-muted" aria-hidden="true" />
            <span className="text-xs font-medium text-muted">Connect</span>
          </>
        )}
      </button>
    </header>
  );
}
