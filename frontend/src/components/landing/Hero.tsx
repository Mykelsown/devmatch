/**
 * Hero — the landing headline block.
 * Uppercase condensed display type (hero only), glowing gradient headline,
 * glowing CTA pill, and a floating example match ticket behind the eclipse
 * glow.
 */
import { ArrowRight, Fingerprint, Sparkles, Zap } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { TicketCard } from '../ui/TicketCard';
import { ScoreTag } from '../ui/ScoreTag';
import { GlowButton, GhostButton, PolicyChip, TierBadge } from '../ui/primitives';
import { Reveal } from '../ui/Reveal';
import { LANDING_TICKETS } from '../../lib/data';

export function Hero() {
  const { navigate } = useApp();
  const demo = LANDING_TICKETS[0];

  return (
    <section className="relative mx-auto max-w-6xl px-5 pb-20 pt-32 sm:pt-40">
      <div className="grid items-center gap-14 lg:grid-cols-[1.15fr_0.85fr]">
        <Reveal>
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-teal/25 bg-teal/[0.07] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-teal">
              <span className="pulse-dot h-2 w-2 rounded-full bg-teal-bright" />
              Privacy-first matching on Midnight
            </span>

            <h1 className="mt-6 font-display text-[44px] font-extrabold uppercase leading-[0.98] tracking-tight sm:text-[64px]">
              Match on skill.
              <br />
              <span className="text-glow">Not on exposure.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              Your profile becomes a zero-knowledge commitment on the Midnight
              network. The DevMatch circuit proves compatibility with teams,
              without ever revealing your stack, experience, or identity.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <GlowButton size="lg" onClick={() => navigate({ view: 'register' })}>
                Create your profile
                <ArrowRight size={18} aria-hidden="true" />
              </GlowButton>
              <GhostButton size="lg" onClick={() => navigate({ view: 'dashboard' })}>
                Browse matches
              </GhostButton>
            </div>

            <ul className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-muted">
              <li className="flex items-center gap-2">
                <Fingerprint size={15} className="text-teal" aria-hidden="true" />
                ZK-proven compatibility
              </li>
              <li className="flex items-center gap-2">
                <Zap size={15} className="text-teal" aria-hidden="true" />
                Raw data never leaves your device
              </li>
              <li className="flex items-center gap-2">
                <Sparkles size={15} className="text-teal" aria-hidden="true" />
                You control every reveal
              </li>
            </ul>
          </div>
        </Reveal>

        {/* Floating example match ticket */}
        <Reveal delay={120} className="relative flex justify-center">
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[440px] w-[440px] -translate-x-1/2 -translate-y-1/2"
            aria-hidden="true"
          >
            <img
              src="/devmatch-icon-eclipse.svg"
              alt=""
              className="h-full w-full opacity-40 blur-[2px]"
              style={{ filter: 'drop-shadow(0 0 60px rgba(125,232,208,0.35))' }}
            />
          </div>

          <div className="float-y relative w-full max-w-sm">
            <TicketCard className="rotate-[1.5deg]">
              <div className="flex items-start justify-between gap-3 p-5 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-lg font-bold text-mist">{demo.devAlias}</span>
                    <TierBadge tier={demo.tier} />
                  </div>
                  <p className="mt-0.5 text-xs text-faint">wants to build with</p>
                </div>
                <ScoreTag score={demo.score} />
              </div>

              <div className="px-5">
                <p className="text-sm font-semibold text-teal-bright">{demo.project}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {demo.projectStack.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-muted"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="perf mt-4" />

              <div className="flex items-center justify-between gap-3 p-5 pt-4">
                <p className="text-xs leading-relaxed text-muted">{demo.blurb}</p>
                <PolicyChip policy={demo.policy} className="shrink-0" />
              </div>
            </TicketCard>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
