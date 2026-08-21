/**
 * DeveloperCard -- privacy-first developer profile card.
 *
 * Only public information is shown: the developer's contract address (as a
 * unique on-chain identifier), the compatibility score, and the trust tier.
 * All other details (name, stack, experience, availability) are hidden
 * behind the ZK commitment and remain private until both sides agree to
 * a reveal.
 *
 * The card is clickable. If a match exists, it navigates to the match
 * detail view. Otherwise, it opens a placeholder.
 */
import { ArrowUpRight, User } from 'lucide-react';
import { TierBadge } from './primitives';
import type { DeveloperProfile } from '../../lib/types';

/**
 * Generate a deterministic compatibility score from a string seed.
 * In production this comes from the ZK match circuit; for demo purposes
 * we derive a consistent number from the developer ID.
 */
function deterministicScore(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  return 60 + Math.abs(hash) % 39; // 60-98
}

export function DeveloperCard({
  profile,
  onClick,
}: {
  profile: DeveloperProfile;
  onClick?: () => void;
}) {
  const score = deterministicScore(profile.id);
  const isGreen = profile.tier === 'green';

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
      {/* Top row: avatar placeholder + action icon */}
      <div className="flex items-start justify-between">
        <span
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${
            isGreen ? 'bg-amber/20' : 'bg-white/[0.07]'
          }`}
          aria-hidden="true"
        >
          <User size={18} className={isGreen ? 'text-amber' : 'text-muted'} />
        </span>

        <span className="grid h-7 w-7 place-items-center rounded-full bg-white/[0.04] text-muted opacity-0 transition-all group-hover:opacity-100">
          <ArrowUpRight size={14} aria-hidden="true" />
        </span>
      </div>

      {/* Contract address (truncated) -- the only identifying info shown */}
      <p className="mt-3 font-mono text-xs text-muted" title={profile.id}>
        {profile.id.slice(0, 10)}...{profile.id.slice(-6)}
      </p>

      {/* Compatibility score */}
      <div className="mt-3 flex items-center justify-between">
        <span className="rounded-full bg-teal/15 px-3 py-1 text-sm font-bold text-teal-bright">
          {score}%
        </span>
        <TierBadge tier={profile.tier} />
      </div>

      {/* Minimal status dots */}
      <div className="mt-3 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-teal-bright" />
        <span className="h-1.5 w-1.5 rounded-full bg-teal-mid" />
        <span className="h-1.5 w-1.5 rounded-full bg-white/10" />
        <span className="h-1.5 w-1.5 rounded-full bg-white/10" />
      </div>
    </div>
  );
}
