/**
 * Dashboard — browse / match dashboard.
 *
 * Role toggle decides what's browsed: requirements (developer view) or
 * developer profiles (team view). A pill filter bar narrows the grid; cards
 * enter staggered on scroll; the rewards panel sits quietly below.
 */
import { useMemo, useState } from 'react';
import { Building2, SearchX, User } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { FilterBar, type PolicyFilter, type SortMode } from './FilterBar';
import { RequirementCard } from './RequirementCard';
import { ProfileCard } from './ProfileCard';
import { RewardsPanel } from './RewardsPanel';
import { GlowButton, GhostButton, SectionTag } from '../ui/primitives';
import { Reveal } from '../ui/Reveal';
import type { RevealPolicy, Role } from '../../lib/types';

const ROLE_TABS: { role: Role; label: string; icon: typeof User }[] = [
  { role: 'dev', label: "I'm a developer", icon: User },
  { role: 'team', label: "I'm a team", icon: Building2 },
];

export function Dashboard() {
  const { role, setRole, matches, devMatches, isGuest, navigate } = useApp();
  const [stackFilter, setStackFilter] = useState<string[]>([]);
  const [sort, setSort] = useState<SortMode>('score');
  const [policyFilter, setPolicyFilter] = useState<PolicyFilter>('all');

  const list = role === 'dev' ? matches : devMatches;

  const stacks = useMemo(
    () => Array.from(new Set(list.flatMap((m) => m.subject.stack))).sort(),
    [list],
  );

  const filtered = useMemo(() => {
    let out = list;
    if (stackFilter.length > 0) {
      out = out.filter((m) => m.subject.stack.some((s) => stackFilter.includes(s)));
    }
    if (policyFilter !== 'all') {
      out = out.filter((m) => m.policy === (policyFilter as RevealPolicy));
    }
    if (sort === 'score') {
      out = [...out].sort((a, b) => b.score - a.score);
    }
    return out;
  }, [list, stackFilter, policyFilter, sort]);

  const toggleStack = (s: string) =>
    setStackFilter((cur) =>
      cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s],
    );

  return (
    <section className="relative z-10 mx-auto max-w-6xl px-5 pb-24 pt-32 sm:pt-36">
      {/* Header + role toggle */}
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-xl">
            <SectionTag>{role === 'dev' ? 'Developer view' : 'Team view'}</SectionTag>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-mist sm:text-4xl">
              {role === 'dev' ? 'Browse matches' : 'Find your developer'}
            </h2>
            <p className="mt-2 text-sm text-muted">
              Compatibility is proven by the DevMatch circuit from two
              commitments. Scores are real. The data behind them stays hidden.
            </p>
          </div>

          <div
            className="flex items-center gap-1 rounded-full border border-white/10 bg-ink-2/70 p-1 backdrop-blur-md"
            role="tablist"
            aria-label="Browse as"
          >
            {ROLE_TABS.map(({ role: r, label, icon: Icon }) => (
              <button
                key={r}
                role="tab"
                aria-selected={role === r}
                onClick={() => setRole(r)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  role === r ? 'bg-teal text-ink' : 'text-muted hover:text-mist'
                }`}
              >
                <Icon size={15} aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Guest banner */}
      {isGuest && role === 'dev' && (
        <Reveal delay={60}>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-teal/25 bg-teal/[0.06] px-5 py-4">
            <p className="text-sm text-muted">
              Browsing as a guest. Scores use a demo profile. Register yours to
              get <span className="font-semibold text-teal-bright">your</span>{' '}
              real matches.
            </p>
            <GlowButton size="sm" onClick={() => navigate({ view: 'register' })}>
              Register profile
            </GlowButton>
          </div>
        </Reveal>
      )}

      {/* Filters */}
      <Reveal delay={100}>
        <div className="mt-6">
          <FilterBar
            stacks={stacks}
            stackFilter={stackFilter}
            toggleStack={toggleStack}
            sort={sort}
            setSort={setSort}
            policyFilter={policyFilter}
            setPolicyFilter={setPolicyFilter}
          />
        </div>
      </Reveal>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m, i) =>
            role === 'dev' ? (
              <RequirementCard key={m.id} match={m} index={i} />
            ) : (
              <ProfileCard key={m.id} match={m} index={i} />
            ),
          )}
        </div>
      ) : (
        <Reveal>
          <div className="mt-8 flex flex-col items-center rounded-3xl border border-dashed border-white/15 px-6 py-16 text-center">
            <SearchX size={36} className="text-faint" aria-hidden="true" />
            <h3 className="mt-4 font-display text-lg font-bold text-mist">No matches found</h3>
            <p className="mt-1 max-w-sm text-sm text-muted">
              Nothing matches those filters. Clear them to see everything again.
            </p>
            <GhostButton
              className="mt-5"
              onClick={() => {
                setStackFilter([]);
                setPolicyFilter('all');
                setSort('score');
              }}
            >
              Clear filters
            </GhostButton>
          </div>
        </Reveal>
      )}

      {/* Rewards */}
      <Reveal delay={60}>
        <div className="mx-auto mt-12 max-w-2xl">
          <RewardsPanel />
        </div>
      </Reveal>
    </section>
  );
}
