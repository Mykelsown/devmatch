/**
 * RequirementCard — a requirement ticket in the browse grid (developer view).
 *
 * The compatibility score badge is always visible (top-right corner, like the
 * NFT reference price tags). Additional fields appear only when the poster's
 * reveal policy allows them.
 */
import { ArrowRight, Lock } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { TicketCard } from '../ui/TicketCard';
import { ScoreTag } from '../ui/ScoreTag';
import { PolicyChip, TierBadge } from '../ui/primitives';
import { Reveal } from '../ui/Reveal';
import type { Match } from '../../lib/types';

export function RequirementCard({ match, index }: { match: Match; index: number }) {
  const { navigate } = useApp();
  const subj = match.subject;
  const autoRevealed = match.policy === 'fields-on-policy';

  return (
    <Reveal delay={(index % 3) * 80} className="h-full">
      <TicketCard
        className="group h-full transition-transform duration-300 hover:-translate-y-1"
        interactive
        onClick={() => navigate({ view: 'match', id: match.id })}
        label={`Open match with ${subj.title}`}
      >
        <div className="flex items-start justify-between gap-3 p-5 pb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <TierBadge tier={subj.tier} />
              <span className="truncate text-xs font-semibold text-faint">{subj.subtitle}</span>
            </div>
            <h3 className="mt-2 font-display text-[17px] font-bold leading-snug text-mist">
              {subj.title}
            </h3>
          </div>
          <ScoreTag score={match.score} className="shrink-0" />
        </div>

        <p className="line-clamp-2 px-5 text-xs leading-relaxed text-muted">{subj.description}</p>

        <div className="px-5 pt-3">
          {autoRevealed ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {subj.stack.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-teal/25 bg-teal/[0.08] px-2.5 py-0.5 text-[10px] font-semibold text-teal-bright"
                  >
                    {s}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
                {subj.meta.map((m) => (
                  <span key={m.label}>
                    <span className="text-faint">{m.label}:</span> {m.value}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-muted">
              <Lock size={11} aria-hidden="true" />
              {match.policy === 'score-only'
                ? 'Score-only match'
                : 'Details locked · request reveal'}
            </span>
          )}
        </div>

        <div className="perf mt-4" />

        <div className="flex items-center justify-between gap-2 px-5 py-4">
          <PolicyChip policy={match.policy} />
          <span className="text-[11px] text-faint">{match.matchedAt}</span>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-teal transition-transform group-hover:translate-x-0.5">
            Open
            <ArrowRight size={13} aria-hidden="true" />
          </span>
        </div>
      </TicketCard>
    </Reveal>
  );
}
