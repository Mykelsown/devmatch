/**
 * ProfileCard — a developer profile ticket in the browse grid (team view).
 * Same reveal-policy rules as requirement cards, with an avatar for the
 * developer's alias.
 */
import { ArrowRight, Lock } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { TicketCard } from '../ui/TicketCard';
import { ScoreTag } from '../ui/ScoreTag';
import { PolicyChip, TierBadge } from '../ui/primitives';
import { Reveal } from '../ui/Reveal';
import { initialsOf } from '../../lib/data';
import type { Match } from '../../lib/types';

export function ProfileCard({ match, index }: { match: Match; index: number }) {
  const { navigate } = useApp();
  const subj = match.subject;
  // Only fields-on-policy auto-reveals on the card; approval-required and
  // score-only keep everything locked until the reveal flow runs.
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
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-full font-display text-sm font-bold ${
                subj.tier === 'green'
                  ? 'bg-amber/20 text-amber-bright'
                  : 'bg-white/[0.07] text-muted'
              }`}
              aria-hidden="true"
            >
              {initialsOf(subj.title)}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate font-display text-[16px] font-bold text-mist">
                  {subj.title}
                </span>
                <TierBadge tier={subj.tier} />
              </div>
              <p className="text-[11px] text-faint">{subj.subtitle}</p>
            </div>
          </div>
          <ScoreTag score={match.score} className="shrink-0" />
        </div>

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
                ? 'Score-only profile'
                : 'Details locked · request reveal'}
            </span>
          )}
        </div>

        <div className="perf mt-4" />

        <div className="flex items-center justify-between gap-2 px-5 py-4">
          <PolicyChip policy={match.policy} />
          <span className="inline-flex items-center gap-1 text-xs font-bold text-teal transition-transform group-hover:translate-x-0.5">
            View
            <ArrowRight size={13} aria-hidden="true" />
          </span>
        </div>
      </TicketCard>
    </Reveal>
  );
}
