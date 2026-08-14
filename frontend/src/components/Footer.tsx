/**
 * Footer — standard links, light content, plus the "what's public vs private"
 * line that anchors the privacy story.
 */
import { useApp } from '../state/AppContext';

export function Footer() {
  const { navigate, wallet } = useApp();

  return (
    <footer className="relative z-10 border-t border-white/[0.06] bg-ink/40">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <img
                src="/devmatch-icon-eclipse.svg"
                alt=""
                width={30}
                height={30}
                className="h-[30px] w-[30px]"
              />
              <span className="font-display text-lg font-bold tracking-tight text-mist">
                Dev<span className="text-teal-bright">Match</span>
              </span>
            </div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
              Privacy-first developer team-matching on Midnight. Your profile
              lives as a zero-knowledge commitment — matches are proven, never
              exposed.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-faint">Product</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <button onClick={() => navigate({ view: 'register' })} className="text-muted transition-colors hover:text-teal-bright">
                  Register profile
                </button>
              </li>
              <li>
                <button onClick={() => navigate({ view: 'dashboard' })} className="text-muted transition-colors hover:text-teal-bright">
                  Browse matches
                </button>
              </li>
              <li>
                <button onClick={() => navigate({ view: 'landing' })} className="text-muted transition-colors hover:text-teal-bright">
                  Trust tiers
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-faint">Privacy</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-start gap-2 text-muted">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal" />
                Public: commitment hash, tier, reveal policy
              </li>
              <li className="flex items-start gap-2 text-muted">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber" />
                Private: name, stack, experience, availability
              </li>
              <li className="flex items-start gap-2 text-muted">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-faint" />
                Network: {wallet.backend.label}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/[0.06] pt-6 text-xs text-faint sm:flex-row">
          <p>© 2026 DevMatch · Built on Midnight</p>
          <p>Match on skill. Not on exposure.</p>
        </div>
      </div>
    </footer>
  );
}
