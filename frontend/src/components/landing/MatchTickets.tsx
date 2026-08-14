/**
 * MatchTickets — the "below the fold" row of example match tickets.
 * Horizontal scroll on desktop-ish, snap scrolling, staggered entrance.
 */
import { ArrowRight } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { TicketCard } from '../ui/TicketCard';
import { ScoreTag } from '../ui/ScoreTag';
import { PolicyChip, SectionTag, TierBadge } from '../ui/primitives';
import { Reveal } from '../ui/Reveal';
import { LANDING_TICKETS } from '../../lib/data';

export function MatchTickets() {
  const { navigate } = useApp();

  return (
    <section className="relative mx-auto max-w-6xl px-5 py-16">
      <Reveal>
        <div className="max-w-2xl">
          <SectionTag>Live matches</SectionTag>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-mist sm:text-4xl">
            Proof, not profiles.
          </h2>
          <p className="mt-3 text-muted">
            Compatibility is computed inside a zero-knowledge proof. The only
            thing a match ticket ever shows is the score — plus whatever the
            reveal policy allows.
          </p>
        </div>
      </Reveal>

      <div className="mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [scrollbar-width:thin]">
        {LANDING_TICKETS.map((t, i) => (
          <Reveal key={t.id} delay={i * 80} className="w-[290px] shrink-0 snap-start sm:w-[310px]">
            <TicketCard className="h-full" interactive onClick={() => navigate({ view: 'dashboard' })} label={`View matches for ${t.devAlias}`}>
              <div className="flex items-start justify-between gap-3 p-5 pb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-display text-base font-bold text-mist">
                      {t.devAlias}
                    </span>
                    <TierBadge tier={t.tier} />
                  </div>
                  <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-faint">
                    matched with
                  </p>
                </div>
                <ScoreTag score={t.score} className="shrink-0" />
              </div>

              <div className="px-5">
                <p className="text-sm font-semibold leading-snug text-teal-bright">{t.project}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {t.projectStack.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-muted"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="perf mt-4" />

              <div className="flex flex-1 flex-col gap-3 p-5 pt-4">
                <p className="flex-1 text-xs leading-relaxed text-muted">{t.blurb}</p>
                <div className="flex items-center justify-between gap-2">
                  <PolicyChip policy={t.policy} />
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal">
                    View <ArrowRight size={13} aria-hidden="true" />
                  </span>
                </div>
              </div>
            </TicketCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
