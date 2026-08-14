/**
 * AppContext — the single source of truth for the DevMatch UI.
 *
 * Owns routing, wallet state, the viewer's registered profile, the mock
 * marketplace data plane (requirements, developers, computed matches), the
 * per-match reveal flow, accept/decline decisions, and the MATCH rewards
 * panel. All components consume this via `useApp()`.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useHashRoute, type Route } from '../hooks/useHashRoute';
import { useWallet, type WalletController } from '../hooks/useWallet';
import {
  DEMO_VIEWER,
  REQUIREMENTS,
  SAMPLE_DEVELOPERS,
  SEED_REWARDS,
  REWARDS_BASE,
} from '../lib/data';
import type {
  Decision,
  DeveloperProfile,
  Match,
  ProfileInput,
  RegisteredProfile,
  Requirement,
  RevealPhase,
  RevealPolicy,
  RewardActivity,
  RewardsState,
  Role,
} from '../lib/types';

interface AppContextValue {
  route: Route;
  navigate: (route: Route) => void;

  wallet: WalletController;
  walletModalOpen: boolean;
  setWalletModalOpen: (open: boolean) => void;

  role: Role;
  setRole: (role: Role) => void;

  profile: RegisteredProfile | null;
  isGuest: boolean;
  registerFlow: (input: ProfileInput) => Promise<RegisteredProfile>;

  requirements: Requirement[];
  developers: DeveloperProfile[];
  matches: Match[];
  devMatches: Match[];
  getMatch: (id: string) => Match | undefined;

  revealPhase: (id: string) => RevealPhase;
  requestReveal: (id: string) => void;
  decisions: Record<string, Decision>;
  decide: (id: string, decision: 'accepted' | 'declined') => void;

  rewards: RewardsState;
}

const AppContext = createContext<AppContextValue | null>(null);

/** Compatibility score: stack coverage dominates, experience adds a bonus. */
export function computeScore(viewer: ProfileInput, subjectStack: string[]): number {
  if (subjectStack.length === 0) return 62;
  const overlap = subjectStack.filter((s) => viewer.stack.includes(s)).length;
  const coverage = overlap / subjectStack.length;
  const base = 55 + coverage * 40;
  const yearBonus = Math.min(6, Math.max(0, viewer.years - 1) * 0.9);
  return Math.max(55, Math.min(99, Math.round(base + yearBonus)));
}

function hiddenFieldsFor(kind: 'requirement' | 'developer'): string[] {
  return kind === 'requirement'
    ? ['Budget figures', 'Team size', 'Reviewer notes']
    : ['Full name', 'GitHub handle', 'Current employer'];
}

function buildRequirementMatches(viewer: ProfileInput): Match[] {
  return REQUIREMENTS.map((req) => ({
    id: `m-${req.id}`,
    subject: {
      kind: 'requirement' as const,
      id: req.id,
      title: req.title,
      subtitle: req.org,
      description: req.description,
      stack: req.stack,
      meta: [
        { label: 'Hours / wk', value: `${req.hours} hrs` },
        { label: 'Duration', value: req.duration },
        { label: 'Budget', value: req.budget },
      ],
      tier: req.tier,
    },
    score: computeScore(viewer, req.stack),
    // Green postings auto-reveal more; yellow postings require approval.
    policy: (req.tier === 'green' ? 'fields-on-policy' : 'approval-required') as RevealPolicy,
    hiddenFields: hiddenFieldsFor('requirement'),
    matchedAt: req.postedAt,
  }));
}

function buildDeveloperMatches(viewer: ProfileInput, own: DeveloperProfile | null): Match[] {
  const devs = own ? [own, ...SAMPLE_DEVELOPERS] : SAMPLE_DEVELOPERS;
  return devs.map((dev) => {
    // Locked policies must not leak years/hours into the card copy.
    const revealed = dev.policy === 'fields-on-policy';
    const subtitle =
      dev.policy === 'score-only'
        ? 'Score-only profile'
        : dev.policy === 'approval-required'
          ? 'Details locked — request reveal'
          : `${dev.years} yrs · ${dev.hours} hrs/wk`;
    const description =
      dev.policy === 'score-only'
        ? 'This developer shares only a match score with your team.'
        : dev.policy === 'approval-required'
          ? 'An anonymous developer with real experience. Request reveal to see their stack and availability.'
          : `A ${dev.tier === 'green' ? 'GitHub-verified' : 'anonymous'} developer with ${dev.years} years of experience, available ${dev.hours} hours per week.`;
    return {
      id: `d-${dev.id}`,
      subject: {
        kind: 'developer' as const,
        id: dev.id,
        title: dev.alias,
        subtitle,
        description,
        stack: dev.stack,
        meta: [
          { label: 'Experience', value: `${dev.years} years` },
          { label: 'Availability', value: `${dev.hours} hrs/wk` },
          ...(dev.github ? [{ label: 'GitHub', value: `@${dev.github}` }] : []),
        ],
        tier: dev.tier,
      },
      score: computeScore(viewer, dev.stack),
      policy: dev.policy,
      hiddenFields: hiddenFieldsFor('developer'),
      matchedAt: 'just now',
    };
  });
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { route, navigate } = useHashRoute();
  const wallet = useWallet();

  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [role, setRole] = useState<Role>('dev');
  const [profile, setProfile] = useState<RegisteredProfile | null>(null);

  const [revealPhases, setRevealPhases] = useState<Record<string, RevealPhase>>({});
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [activities, setActivities] = useState<RewardActivity[]>(SEED_REWARDS.activities);
  const revealTimers = useRef<Record<string, number>>({});

  useEffect(
    () => () => {
      Object.values(revealTimers.current).forEach((t) => window.clearTimeout(t));
    },
    [],
  );

  /** The stack used to score matches — the registered profile, or a demo one. */
  const viewer: ProfileInput = profile ?? DEMO_VIEWER;

  const matches = useMemo(() => buildRequirementMatches(viewer), [viewer]);
  const devMatches = useMemo(() => buildDeveloperMatches(viewer, profile ? {
    id: profile.id,
    alias: profile.name,
    stack: profile.stack,
    years: profile.years,
    hours: profile.hours,
    tier: profile.tier,
    policy: profile.policy,
    github: profile.github,
    isViewer: true,
  } : null), [viewer, profile]);

  const getMatch = useCallback(
    (id: string) => matches.find((m) => m.id === id) ?? devMatches.find((m) => m.id === id),
    [matches, devMatches],
  );

  const registerFlow = useCallback(
    async (input: ProfileInput): Promise<RegisteredProfile> => {
      const result = await wallet.registerProfile(input);
      const registered: RegisteredProfile = {
        ...input,
        id: 'dev-me',
        commitment: result.commitment,
        txId: result.txId,
        network: result.network,
        registeredAt: new Date().toISOString(),
      };
      setProfile(registered);
      if (input.tier === 'green') {
        setActivities((acts) =>
          acts.map((a) => (a.id === 'rw-verify' ? { ...a, state: 'completed' } : a)),
        );
      }
      return registered;
    },
    [wallet],
  );

  const requestReveal = useCallback((id: string) => {
    setRevealPhases((p) => ({ ...p, [id]: 'requested' }));
    revealTimers.current[id] = window.setTimeout(() => {
      setRevealPhases((p) => ({ ...p, [id]: 'revealed' }));
    }, 2600);
  }, []);

  const revealPhase = useCallback(
    (id: string): RevealPhase => revealPhases[id] ?? 'locked',
    [revealPhases],
  );

  const decide = useCallback((id: string, decision: 'accepted' | 'declined') => {
    setDecisions((prev) => ({ ...prev, [id]: decision }));
    if (decision === 'accepted') {
      // Release the requirement deposit + pay the match-accept reward.
      setActivities((acts) =>
        acts.map((a) =>
          a.id === 'rw-deposit' || a.id === 'rw-release'
            ? { ...a, state: 'completed' }
            : a,
        ),
      );
    }
  }, []);

  const rewards: RewardsState = useMemo(() => {
    const delta = activities.reduce(
      (acc, a) => (a.state === 'completed' ? acc + (a.delta === '+' ? a.amount : -a.amount) : acc),
      0,
    );
    return { balance: REWARDS_BASE + delta, activities };
  }, [activities]);

  const value: AppContextValue = {
    route,
    navigate,
    wallet,
    walletModalOpen,
    setWalletModalOpen,
    role,
    setRole,
    profile,
    isGuest: profile === null,
    registerFlow,
    requirements: REQUIREMENTS,
    developers: SAMPLE_DEVELOPERS,
    matches,
    devMatches,
    getMatch,
    revealPhase,
    requestReveal,
    decisions,
    decide,
    rewards,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
