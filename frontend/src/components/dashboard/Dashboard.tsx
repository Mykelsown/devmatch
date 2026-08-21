/**
 * Dashboard — browse / match dashboard with sidebar shell.
 *
 * Uses the Sidebar + TopBar layout. Main content area has two section stacks:
 * "Available Developers" (shown to teams/recruiters) and "Open Requirements"
 * (shown to developers), each with a section header, count badge, filter pill
 * row, and card grid. The sidebar nav tracks which section is active.
 */
import { useMemo, useState } from 'react';
import { SearchX, LogOut, Shield, User, Briefcase } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { Sidebar, type SidebarSection } from '../layout/Sidebar';
import { TopBar } from '../layout/TopBar';
import { DeveloperCard } from '../ui/DeveloperCard';
import { RequirementCard } from '../ui/RequirementCard';
import { RewardsPanel } from './RewardsPanel';
import { Chip, GhostButton, GlowButton } from '../ui/primitives';
import { Reveal } from '../ui/Reveal';
import { FloatingActionBar } from '../ui/FloatingActionBar';
import { SAMPLE_DEVELOPERS, REQUIREMENTS } from '../../lib/data';

const DEV_FILTERS = ['All', 'Full-stack', 'Frontend', 'Backend', 'Smart Contract', 'Available Now'] as const;
const REQ_FILTERS = ['All', 'Hot', 'New This Week', 'Remote', 'In-Person'] as const;

type DevFilter = typeof DEV_FILTERS[number];
type ReqFilter = typeof REQ_FILTERS[number];

function SectionHeader({
  title,
  count,
  icon,
}: {
  title: string;
  count: number;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      {icon}
      <h2 className="font-display text-lg font-bold text-mist">{title}</h2>
      <span className="rounded-full bg-teal/15 px-2.5 py-0.5 text-xs font-bold text-teal-bright">
        {count}
      </span>
    </div>
  );
}

function FilterPillRow<T extends string>({
  filters,
  active,
  onSelect,
}: {
  filters: readonly T[];
  active: T;
  onSelect: (filter: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {filters.map((f) => (
        <Chip key={f} on={active === f} onClick={() => onSelect(f)} className="px-3! py-1! text-xs!">
          {f}
        </Chip>
      ))}
    </div>
  );
}

export function Dashboard() {
  const { role, setRole, isGuest, navigate, dashboardSection, setDashboardSection, logout, wallet, isRegistered } = useApp();
  const [devFilter, setDevFilter] = useState<DevFilter>('All');
  const [reqFilter, setReqFilter] = useState<ReqFilter>('All');

  // Build developer list from mock data
  const allDevelopers = useMemo(() => SAMPLE_DEVELOPERS, []);

  // Build requirement list from matches (team view) or mock data
  const allRequirements = useMemo(() => REQUIREMENTS, []);

  // Filter developers by selected filter
  const filteredDevelopers = useMemo(() => {
    let list = allDevelopers;
    if (devFilter === 'Full-stack') {
      list = list.filter((d) => d.stack.length >= 3);
    } else if (devFilter === 'Frontend') {
      list = list.filter((d) => d.stack.some((s) => ['React', 'Vue', 'TypeScript'].includes(s)));
    } else if (devFilter === 'Backend') {
      list = list.filter((d) => d.stack.some((s) => ['Rust', 'Go', 'Python', 'Node.js'].includes(s)));
    } else if (devFilter === 'Smart Contract') {
      list = list.filter((d) => d.stack.some((s) => ['Solidity', 'Smart contracts', 'Zero-knowledge'].includes(s)));
    } else if (devFilter === 'Available Now') {
      list = list.filter((d) => d.hours >= 20);
    }
    return list;
  }, [allDevelopers, devFilter]);

  // Filter requirements by selected filter
  const filteredRequirements = useMemo(() => {
    let list = allRequirements;
    if (reqFilter === 'Hot') {
      list = list.filter((r) => r.tier === 'green');
    } else if (reqFilter === 'New This Week') {
      list = list.filter((r) => r.postedAt.includes('d') || r.postedAt.includes('h'));
    } else if (reqFilter === 'Remote') {
      // All are remote for now
      list = list.filter(() => true);
    }
    return list;
  }, [allRequirements, reqFilter]);

  const handleSectionNavigate = (section: SidebarSection) => {
    setDashboardSection(section);
  };

  /* Settings section */
  if (dashboardSection === 'settings') {
    return (
      <div className="flex min-h-screen">
        <Sidebar activeSection={dashboardSection} onNavigate={handleSectionNavigate} />
        <div className="flex flex-1 flex-col pl-16">
          <TopBar />
          <main className="flex-1 overflow-y-auto px-6 py-6">
            <Reveal>
              <div className="mx-auto max-w-lg space-y-6">
                <h2 className="font-display text-2xl font-extrabold tracking-tight text-mist">
                  Settings
                </h2>

                {/* Registration status */}
                <div className="rounded-xl border border-white/[0.06] bg-surface p-5">
                  <h3 className="text-sm font-bold text-mist">Registration status</h3>
                  <div className="mt-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm text-muted">
                        <User size={15} className="text-teal-bright" aria-hidden="true" />
                        Role
                      </span>
                      <span className="rounded-full bg-teal/15 px-2.5 py-0.5 text-xs font-bold text-teal-bright">
                        {role === 'dev' ? 'Developer' : 'Team / Recruiter'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm text-muted">
                        <Shield size={15} className="text-teal-bright" aria-hidden="true" />
                        Status
                      </span>
                      <span className="text-sm font-medium text-teal-bright">
                        {isRegistered ? 'Registered' : 'Not registered'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm text-muted">
                        <Briefcase size={15} className="text-muted" aria-hidden="true" />
                        Wallet
                      </span>
                      <span className="text-sm text-muted">
                        {wallet.status.kind === 'connected' && wallet.snapshot
                          ? wallet.snapshot.shortAddress
                          : 'Not connected'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Disconnect and clear registration */}
                <div className="rounded-xl border border-white/[0.06] bg-surface p-5">
                  <h3 className="text-sm font-bold text-mist">Account</h3>
                  <p className="mt-2 text-xs text-muted">
                    Disconnect your wallet and clear your registration. You will need to
                    re-register to access the dashboard.
                  </p>
                  <button
                    onClick={() => {
                      logout();
                      navigate({ view: 'landing' });
                    }}
                    className="mt-4 flex items-center gap-2 rounded-xl border border-terracotta/30 bg-terracotta/10 px-4 py-2.5 text-sm font-medium text-terracotta transition-colors hover:bg-terracotta/20"
                  >
                    <LogOut size={15} aria-hidden="true" />
                    Disconnect and clear registration
                  </button>
                </div>
              </div>
            </Reveal>
          </main>
        </div>
        <FloatingActionBar />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar activeSection={dashboardSection} onNavigate={handleSectionNavigate} />

      <div className="flex flex-1 flex-col pl-16">
        <TopBar />

        <main className="flex-1 overflow-y-auto px-6 py-6">
          {/* Guest banner */}
          {isGuest && (
            <Reveal>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-teal/25 bg-teal/[0.06] px-5 py-4">
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

          {/* Role toggle (for switching view) */}
          <Reveal delay={30}>
            <div className="mb-6 flex items-center gap-3">
              <button
                onClick={() => setRole('dev')}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  role === 'dev'
                    ? 'bg-teal text-ink'
                    : 'border border-white/10 bg-white/[0.03] text-muted hover:text-mist'
                }`}
              >
                Developer view
              </button>
              <button
                onClick={() => setRole('team')}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  role === 'team'
                    ? 'bg-teal text-ink'
                    : 'border border-white/10 bg-white/[0.03] text-muted hover:text-mist'
                }`}
              >
                Team view
              </button>
            </div>
          </Reveal>

          {/* Available Developers section (shown to teams/recruiters) */}
          <Reveal delay={60}>
            <section className="mb-10">
              <SectionHeader
                title="Available Developers"
                count={filteredDevelopers.length}
              />
              <div className="mt-4">
                <FilterPillRow
                  filters={DEV_FILTERS}
                  active={devFilter}
                  onSelect={setDevFilter}
                />
              </div>

              {filteredDevelopers.length > 0 ? (
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredDevelopers.map((dev) => (
                    <DeveloperCard
                      key={dev.id}
                      profile={dev}
                      onClick={() => navigate({ view: 'dashboard' })}
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-5 flex flex-col items-center rounded-xl border border-dashed border-white/15 px-6 py-12 text-center">
                  <SearchX size={32} className="text-faint" aria-hidden="true" />
                  <h3 className="mt-3 text-sm font-bold text-mist">No developers found</h3>
                  <p className="mt-1 text-xs text-muted">
                    Try adjusting your filters.
                  </p>
                  <GhostButton className="mt-4" onClick={() => setDevFilter('All')}>
                    Clear filters
                  </GhostButton>
                </div>
              )}
            </section>
          </Reveal>

          {/* Open Requirements section (shown to developers) */}
          <Reveal delay={90}>
            <section className="mb-10">
              <SectionHeader
                title="Open Requirements"
                count={filteredRequirements.length}
              />
              <div className="mt-4">
                <FilterPillRow
                  filters={REQ_FILTERS}
                  active={reqFilter}
                  onSelect={setReqFilter}
                />
              </div>

              {filteredRequirements.length > 0 ? (
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredRequirements.map((req) => (
                    <RequirementCard
                      key={req.id}
                      requirement={req}
                      onClick={() => navigate({ view: 'dashboard' })}
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-5 flex flex-col items-center rounded-xl border border-dashed border-white/15 px-6 py-12 text-center">
                  <SearchX size={32} className="text-faint" aria-hidden="true" />
                  <h3 className="mt-3 text-sm font-bold text-mist">No requirements found</h3>
                  <p className="mt-1 text-xs text-muted">
                    Try adjusting your filters.
                  </p>
                  <GhostButton className="mt-4" onClick={() => setReqFilter('All')}>
                    Clear filters
                  </GhostButton>
                </div>
              )}
            </section>
          </Reveal>

          {/* Rewards */}
          <Reveal delay={120}>
            <div className="mx-auto max-w-2xl">
              <RewardsPanel />
            </div>
          </Reveal>
        </main>
      </div>

      <FloatingActionBar />
    </div>
  );
}
