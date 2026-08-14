/**
 * Navbar — pill-shaped glass navbar, slightly inset from the top edge.
 * Logo left, section links center, wallet button right. On mobile the links
 * collapse behind a menu toggle.
 */
import { useState } from 'react';
import { Menu, X, ChevronDown, Loader2, Check, Wallet } from 'lucide-react';
import { useApp } from '../state/AppContext';
import { GlowButton } from './ui/primitives';

function WalletButton() {
  const { wallet, setWalletModalOpen } = useApp();
  const { status, snapshot, backend } = wallet;

  if (status.kind === 'connecting') {
    return (
      <button
        className="btn-glow px-4 py-2 text-sm opacity-90"
        disabled
        aria-label="Connecting wallet"
      >
        <Loader2 size={16} className="animate-spin" aria-hidden="true" />
        Connecting…
      </button>
    );
  }

  if (status.kind === 'connected' && snapshot) {
    return (
      <button
        onClick={() => setWalletModalOpen(true)}
        className="btn-pill px-4 py-2 text-sm"
        aria-label={`Connected wallet ${snapshot.shortAddress}. Open wallet panel.`}
      >
        <span className="relative flex h-2 w-2">
          <span className="pulse-dot absolute inline-flex h-2 w-2 rounded-full bg-teal-bright" />
        </span>
        <span className="font-mono text-[13px] font-medium text-mist">{snapshot.shortAddress}</span>
        <ChevronDown size={14} className="text-faint" aria-hidden="true" />
      </button>
    );
  }

  return (
    <GlowButton size="sm" onClick={() => setWalletModalOpen(true)}>
      <Wallet size={16} aria-hidden="true" />
      Connect wallet
    </GlowButton>
  );
}

export function Navbar() {
  const { navigate, route } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);

  const go = (view: 'landing' | 'dashboard' | 'register', scrollTo?: string) => {
    setMenuOpen(false);
    navigate({ view });
    if (scrollTo) {
      window.setTimeout(() => {
        document.getElementById(scrollTo)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    } else {
      window.scrollTo({ top: 0 });
    }
  };

  const links: { label: string; action: () => void; active: boolean }[] = [
    {
      label: 'How it works',
      action: () => go('landing', 'how-it-works'),
      active: route.view === 'landing',
    },
    {
      label: 'For developers',
      action: () => go('dashboard'),
      active: route.view === 'dashboard' && true,
    },
    {
      label: 'For teams',
      action: () => go('dashboard'),
      active: route.view === 'dashboard',
    },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-5 sm:pt-4">
      <nav
        className="mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full border border-white/10 bg-ink-2/70 py-2 pl-3 pr-2 backdrop-blur-xl"
        aria-label="Main navigation"
      >
        <button
          onClick={() => go('landing')}
          className="flex shrink-0 items-center gap-2 rounded-full px-1.5 transition-opacity hover:opacity-85"
          aria-label="DevMatch home"
        >
          <img
            src="/devmatch-icon-eclipse.svg"
            alt=""
            width={34}
            height={34}
            className="h-[34px] w-[34px]"
          />
          <span className="hidden font-display text-[19px] font-bold tracking-tight text-mist sm:block">
            Dev<span className="text-teal-bright">Match</span>
          </span>
        </button>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <button
              key={l.label}
              onClick={l.action}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                l.active
                  ? 'bg-white/[0.06] text-mist'
                  : 'text-muted hover:bg-white/[0.04] hover:text-mist'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <WalletButton />
          <button
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-muted transition-colors hover:text-mist md:hidden"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="mx-auto mt-2 max-w-6xl animate-fade-up rounded-3xl border border-white/10 bg-ink-2/95 p-2 backdrop-blur-xl md:hidden">
          {links.map((l) => (
            <button
              key={l.label}
              onClick={l.action}
              className="flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-left text-sm font-medium text-mist transition-colors hover:bg-white/[0.06]"
            >
              {l.active && <Check size={14} className="text-teal" />}
              {l.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
