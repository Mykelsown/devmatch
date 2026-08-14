/**
 * FilterBar — pill-row filter/sort controls matching the navbar style.
 * Stack chips filter, plus sort and reveal-policy pills.
 */
import { ArrowDownWideNarrow, Clock, Filter } from 'lucide-react';
import { Chip } from '../ui/primitives';
import type { RevealPolicy } from '../../lib/types';
import { POLICY_META } from '../../lib/data';

export type SortMode = 'score' | 'newest';
export type PolicyFilter = RevealPolicy | 'all';

export function FilterBar({
  stacks,
  stackFilter,
  toggleStack,
  sort,
  setSort,
  policyFilter,
  setPolicyFilter,
}: {
  stacks: string[];
  stackFilter: string[];
  toggleStack: (s: string) => void;
  sort: SortMode;
  setSort: (s: SortMode) => void;
  policyFilter: PolicyFilter;
  setPolicyFilter: (p: PolicyFilter) => void;
}) {
  const policyOptions: { value: PolicyFilter; label: string }[] = [
    { value: 'all', label: 'All policies' },
    { value: 'score-only', label: POLICY_META['score-only'].label },
    { value: 'fields-on-policy', label: POLICY_META['fields-on-policy'].label },
    { value: 'approval-required', label: POLICY_META['approval-required'].label },
  ];

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-full border border-white/10 bg-ink-2/60 px-4 py-3 backdrop-blur-md">
      <div className="flex min-w-0 items-center gap-2">
        <Filter size={14} className="shrink-0 text-faint" aria-hidden="true" />
        <div className="flex flex-wrap gap-1.5">
          {stacks.map((s) => (
            <Chip key={s} on={stackFilter.includes(s)} onClick={() => toggleStack(s)} className="px-3! py-1! text-xs!">
              {s}
            </Chip>
          ))}
        </div>
      </div>

      <div className="hidden h-6 w-px bg-white/10 sm:block" aria-hidden="true" />

      <div className="flex items-center gap-1.5">
        <ArrowDownWideNarrow size={14} className="text-faint" aria-hidden="true" />
        <Chip on={sort === 'score'} onClick={() => setSort('score')} className="px-3! py-1! text-xs!">
          Top match
        </Chip>
        <Chip on={sort === 'newest'} onClick={() => setSort('newest')} className="px-3! py-1! text-xs!">
          <Clock size={12} aria-hidden="true" />
          Newest
        </Chip>
      </div>

      <div className="hidden h-6 w-px bg-white/10 sm:block" aria-hidden="true" />

      <div className="flex flex-wrap items-center gap-1.5">
        {policyOptions.map((p) => (
          <Chip
            key={p.value}
            on={policyFilter === p.value}
            onClick={() => setPolicyFilter(p.value)}
            className="px-3! py-1! text-xs!"
          >
            {p.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}
