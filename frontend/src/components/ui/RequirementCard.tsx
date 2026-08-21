/**
 * RequirementCard — CRM-style requirement posting card.
 *
 * Rounded-xl, dark surface background, briefcase icon top-left, diagonal
 * arrow action icon top-right, title and org below, tag pills for stack,
 * tier badge, meta row for hours/budget/duration, and colored dot row.
 */
import { ArrowUpRight, Briefcase } from 'lucide-react';
import { TierBadge } from './primitives';
import type { Requirement } from '../../lib/types';

export function RequirementCard({
  requirement,
  onClick,
  matchScore,
}: {
  requirement: Requirement;
  onClick?: () => void;
  matchScore?: number;
}) {
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
            requirement.tier === 'green'
              ? 'bg-amber/20 text-amber'
              : 'bg-white/[0.07] text-muted'
          }`}
          aria-hidden="true"
        >
          <Briefcase size={18} />
        </span>

        <div className="flex items-center gap-2">
          {matchScore !== undefined && (
            <span className="rounded-full bg-teal/15 px-2.5 py-0.5 text-xs font-bold text-teal-bright">
              {matchScore}%
            </span>
          )}
          <span className="grid h-7 w-7 place-items-center rounded-full bg-white/[0.04] text-muted opacity-0 transition-all group-hover:opacity-100">
            <ArrowUpRight size={14} aria-hidden="true" />
          </span>
        </div>
      </div>

      {/* Title + org + tier */}
      <div className="mt-3">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-display text-[15px] font-bold text-mist">
            {requirement.title}
          </h3>
          <TierBadge tier={requirement.tier} />
        </div>
        <p className="mt-0.5 text-xs text-muted">{requirement.org}</p>
      </div>

      {/* Description (clamped) */}
      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted">
        {requirement.description}
      </p>

      {/* Stack tag pills */}
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {requirement.stack.map((s) => (
          <span
            key={s}
            className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[10px] font-medium text-muted"
          >
            {s}
          </span>
        ))}
      </div>

      {/* Meta row: hours, budget, duration, policy */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted">
        <span>{requirement.hours}h/wk</span>
        <span className="text-white/10">|</span>
        <span>{requirement.budget}</span>
        <span className="text-white/10">|</span>
        <span>{requirement.duration}</span>
      </div>

      {/* Match-status dot row */}
      <div className="mt-3 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-terracotta" />
        <span className="h-1.5 w-1.5 rounded-full bg-amber" />
        <span className="h-1.5 w-1.5 rounded-full bg-white/10" />
        <span className="h-1.5 w-1.5 rounded-full bg-white/10" />
      </div>
    </div>
  );
}
