/**
 * RewardsPanel — MATCH token balance + the three labeled activity flows:
 * verification reward, requirement deposit, match-accept release.
 * Kept understated — a small card, not a crypto dashboard.
 */
import { BadgeCheck, Coins, Sparkles, TrendingUp } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { TicketCard } from '../ui/TicketCard';
import type { RewardActivity } from '../../lib/types';

const KIND_STYLE: Record<RewardActivity['kind'], { icon: typeof Coins; iconClass: string }> = {
  verification: { icon: BadgeCheck, iconClass: 'bg-amber/15 text-amber-bright' },
  deposit: { icon: Coins, iconClass: 'bg-white/[0.06] text-muted' },
  release: { icon: Sparkles, iconClass: 'bg-teal/[0.14] text-teal-bright' },
};

export function RewardsPanel() {
  const { rewards } = useApp();
  const sessionDelta = rewards.activities
    .filter((a) => a.state === 'completed')
    .reduce((acc, a) => acc + (a.delta === '+' ? a.amount : -a.amount), 0);

  return (
    <TicketCard innerClassName="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-faint">
            MATCH rewards
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-4xl font-extrabold tracking-tight text-mist">
              {rewards.balance.toLocaleString()}
            </span>
            <span className="text-sm font-semibold text-teal">MATCH</span>
          </div>
          <p className="mt-1 text-xs text-faint">Demo token on the Midnight preview network</p>
        </div>

        {sessionDelta > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full border border-teal/30 bg-teal/[0.08] px-3 py-1 text-xs font-bold text-teal-bright">
            <TrendingUp size={13} aria-hidden="true" />
            +{sessionDelta.toLocaleString()} this session
          </span>
        )}
      </div>

      <ul className="mt-5 divide-y divide-white/[0.06]">
        {rewards.activities.map((a) => {
          const { icon: Icon, iconClass } = KIND_STYLE[a.kind];
          const done = a.state === 'completed';
          return (
            <li key={a.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${iconClass}`}>
                <Icon size={16} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-mist">{a.label}</p>
                <p className="truncate text-xs text-faint">{a.detail}</p>
              </div>
              <span
                className={`font-mono text-sm font-bold ${
                  a.delta === '+' ? 'text-teal-bright' : 'text-muted'
                }`}
              >
                {a.delta === '+' ? '+' : '−'}
                {a.amount.toLocaleString()}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                  done
                    ? 'border border-teal/30 bg-teal/[0.08] text-teal-bright'
                    : 'border border-white/10 bg-white/[0.03] text-faint'
                }`}
              >
                {done ? 'Completed' : 'Pending'}
              </span>
            </li>
          );
        })}
      </ul>
    </TicketCard>
  );
}
