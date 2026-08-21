/**
 * RequirementCard -- privacy-first requirement posting card.
 *
 * Public information only: the project title, organization, compatibility
 * score, and trust tier. Detailed requirements (stack, hours, budget,
 * duration) stay private behind the ZK commitment until a reveal is
 * approved.
 *
 * The card is clickable. If a match exists, it navigates to the match
 * detail view. Otherwise, it opens a placeholder.
 */
import { ArrowUpRight, Briefcase } from 'lucide-react';
import { TierBadge } from './primitives';
import type { Requirement } from '../../lib/types';

/**
 * Generate a deterministic compatibility score from a string seed.
 * In production this comes from the ZK match circuit; for demo purposes
 * we derive a consistent number from the requirement ID.
 */
function deterministicScore(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  return 65 + Math.abs(hash) % 34; // 65-98
}

export function RequirementCard({
  requirement,
  onClick,
}: {
  requirement: Requirement;
  onClick?: () => void;
}) {
  const score = deterministicScore(requirement.id);
  const isGreen = requirement.tier === 'green';

  return (
    <div
      className="group relative cursor-pointer rounded-xl border border-white/[0.06] bg-surface p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-teal/20 hover:bg-surface-alt"
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {/* Top row: icon + action icon */}
      <div className="flex items-start justify-between">
        <span
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${
            isGreen ? 'bg-amber/20' : 'bg-white/[0.07]'
          }`}
          aria-hidden="true"
        >
          <Briefcase size={18} className={isGreen ? 'text-amber' : 'text-muted'} />
        </span>

        <span className="grid h-7 w-7 place-items-center rounded-full bg-white/[0.04] text-muted opacity-0 transition-all group-hover:opacity-100">
          <ArrowUpRight size={14} aria-hidden="true" />
        </span>
      </div>

      {/* Title + org (public) */}
      <h3 className="mt-3 font-display text-[15px] font-bold text-mist">
        {requirement.title}
      </h3>
      <p className="mt-0.5 text-xs text-muted">{requirement.org}</p>

      {/* Compatibility score + tier */}
      <div className="mt-3 flex items-center justify-between">
        <span className="rounded-full bg-teal/15 px-3 py-1 text-sm font-bold text-teal-bright">
          {score}%
        </span>
        <TierBadge tier={requirement.tier} />
      </div>

      {/* Minimal status dots */}
      <div className="mt-3 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-terracotta" />
        <span className="h-1.5 w-1.5 rounded-full bg-amber" />
        <span className="h-1.5 w-1.5 rounded-full bg-white/10" />
        <span className="h-1.5 w-1.5 rounded-full bg-white/10" />
      </div>
    </div>
  );
}
