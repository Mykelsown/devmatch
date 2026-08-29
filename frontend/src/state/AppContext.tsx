/**
 * AppContext — the single source of truth for the DevMatch UI.
 *
 * Owns routing, wallet state, the viewer's registered profile, the mock
 * marketplace data plane (requirements, developers, computed matches), the
 * per-match reveal flow, accept/decline decisions, and the MATCH rewards
 * panel. All domain logic lives in `lib/appState.ts` (pure, unit-tested);
 * this provider only wires it to React state, timers, and the wallet backend.
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
  applyDecisionToActivities,
  approveRevealPhase,
  buildDeveloperMatches,
  buildRequirementMatches,
  computeRewardsBalance,
  markVerificationCompleted,
  requestRevealPhase,
} from '../lib/appState';
import { DEMO_VIEWER, REQUIREMENTS, SAMPLE_DEVELOPERS, SEED_REWARDS } from '../lib/data';
import type {
  Decision,
  DeveloperProfile,
  Match,
  ProfileInput,
  RegisteredProfile,
  Requirement,
  RevealPhase,
  RewardActivity,
  RewardsState,
  Role,
} from '../lib/types';
import type { SidebarSection } from '../components/layout/Sidebar';

interface AppContextValue {
  route: Route;
  navigate: (route: Route) => void;

  wallet: WalletController;
  walletModalOpen: boolean;
  setWalletModalOpen: (open: boolean) => void;

  role: Role;
  setRole: (role: Role) => void;

  dashboardSection: SidebarSection;
  setDashboardSection: (section: SidebarSection) => void;

  /** Whether the user has completed registration (stored in localStorage). */
  isRegistered: boolean;
  /** Complete the registration flow and persist to localStorage. */
  completeRegistration: () => void;
  /** Clear registration state, wallet, and localStorage. */
  logout: () => void;

  /** Whether a GitHub OAuth callback is pending processing. */
  oauthCallbackPending: boolean;
  setOauthCallbackPending: (pending: boolean) => void;

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

export function AppProvider({ children }: { children: ReactNode }) {
  const { route, navigate } = useHashRoute();
  const wallet = useWallet();

  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [role, setRole] = useState<Role>(() => {
    const stored = localStorage.getItem('devmatch:userRole');
    return stored === 'team' ? 'team' : 'dev';
  });
  const [dashboardSection, setDashboardSection] = useState<SidebarSection>('dashboard');
  const [profile, setProfile] = useState<RegisteredProfile | null>(null);

  // Registration state persisted in localStorage.
  const [isRegistered, setIsRegistered] = useState(() => {
    return localStorage.getItem('devmatch:registrationStatus') === 'registered';
  });

  // On mount, check if we have a GitHub OAuth code in the URL.
  // If so, we need to show the register flow to process it.
  const [oauthCallbackPending, setOauthCallbackPending] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    return Boolean(params.get('code') && params.get('state'));
  });

  // If returning from GitHub OAuth, force-navigate to the register view.
  useEffect(() => {
    if (oauthCallbackPending && route.view !== 'register') {
      navigate({ view: 'register' });
    }
  }, []); // run once on mount only

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
  const devMatches = useMemo(
    () =>
      buildDeveloperMatches(
        viewer,
        profile
          ? {
              id: profile.id,
              alias: profile.name,
              stack: profile.stack,
              years: profile.years,
              hours: profile.hours,
              tier: profile.tier,
              policy: profile.policy,
              github: profile.github,
              isViewer: true,
            }
          : null,
      ),
    [viewer, profile],
  );

  const getMatch = useCallback(
    (id: string) => matches.find((m) => m.id === id) ?? devMatches.find((m) => m.id === id),
    [matches, devMatches],
  );

  const completeRegistration = useCallback(() => {
    localStorage.setItem('devmatch:registrationStatus', 'registered');
    setIsRegistered(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('devmatch:registrationStatus');
    localStorage.removeItem('devmatch:userRole');
    setIsRegistered(false);
    setProfile(null);
    setRole('dev');
    wallet.disconnect();
  }, [wallet]);

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
        // GitHub attestation pays the verification reward.
        setActivities((acts) => markVerificationCompleted(acts));
      }
      return registered;
    },
    [wallet],
  );

  const requestReveal = useCallback((id: string) => {
    setRevealPhases((p) => requestRevealPhase(p, id));
    revealTimers.current[id] = window.setTimeout(() => {
      // Demo: the other side auto-approves shortly after the request.
      setRevealPhases((p) => approveRevealPhase(p, id));
    }, 2600);
  }, []);

  const revealPhase = useCallback(
    (id: string): RevealPhase => revealPhases[id] ?? 'locked',
    [revealPhases],
  );

  const decide = useCallback((id: string, decision: 'accepted' | 'declined') => {
    setDecisions((prev) => ({ ...prev, [id]: decision }));
    // Accepted matches release the requirement deposit + pay the match-accept reward.
    setActivities((acts) => applyDecisionToActivities(acts, decision));
  }, []);

  const rewards: RewardsState = useMemo(
    () => ({ balance: computeRewardsBalance(activities), activities }),
    [activities],
  );

  const value: AppContextValue = {
    route,
    navigate,
    wallet,
    walletModalOpen,
    setWalletModalOpen,
    role,
    setRole,
    dashboardSection,
    setDashboardSection,
    isRegistered,
    completeRegistration,
    logout,
    oauthCallbackPending,
    setOauthCallbackPending,
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
