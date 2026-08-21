/**
 * DeveloperCard — CRM-style developer profile card.
 *
 * Rounded-xl, dark surface background, avatar top-left, diagonal arrow
 * action icon top-right, name and role below, tag pills for stack,
 * tier badge (Green in amber, Yellow in muted teal), and colored dot
 * row for match-status indicators.
 */
import { ArrowUpRight } from 'lucide-react';
import { TierBadge, PolicyChip } from './primitives';
import type { DeveloperProfile } from '../../lib/types';
import { initialsOf } from '../../lib/data';

export function DeveloperCard({
  profile,
  onClick,
  matchScore,
}: {
  profile: DeveloperProfile;
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
      {/* Top row: avatar + action icon */}
      <div className="flex items-start justify-between">
        <span
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-full font-display text-sm font-bold ${
            profile.tier === 'green'
              ? 'bg-amber/20 text-amber'
              : 'bg-white/[0.07] text-muted'
          }`}
          aria-hidden="true"
        >
          {initialsOf(profile.alias)}
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

      {/* Name + tier badge */}
      <div className="mt-3 flex items-center gap-2">
        <h3 className="truncate font-display text-[15px] font-bold text-mist">
          {profile.alias}
        </h3>
        <TierBadge tier={profile.tier} />
      </div>

      {/* Stack tag pills */}
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {profile.stack.map((s) => (
          <span
            key={s}
            className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[10px] font-medium text-muted"
          >
            {s}
          </span>
        ))}
      </div>

      {/* Meta row: experience + availability + policy */}
      <div className="mt-3 flex items-center gap-3 text-[11px] text-muted">
        <span>{profile.years}y exp</span>
        <span className="text-white/10">|</span>
        <span>{profile.hours}h/wk</span>
        <span className="text-white/10">|</span>
        <PolicyChip policy={profile.policy} />
      </div>

      {/* Match-status dot row */}
      <div className="mt-3 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-teal-bright" />
        <span className="h-1.5 w-1.5 rounded-full bg-teal-mid" />
        <span className="h-1.5 w-1.5 rounded-full bg-white/10" />
        <span className="h-1.5 w-1.5 rounded-full bg-white/10" />
      </div>
    </div>
  );
}
