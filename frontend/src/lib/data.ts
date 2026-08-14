/**
 * Mock data + copy constants for the DevMatch UI.
 *
 * The browse/dashboard data plane is intentionally mocked for now — the
 * on-chain contract only supports profile commitment registration. All of
 * this lives behind the same types the real data plane will use.
 */
import type {
  DeveloperProfile,
  LandingTicket,
  ProfileInput,
  Requirement,
  RevealPolicy,
  RewardActivity,
  RewardsState,
  TrustTier,
} from './types';

export const STACK_OPTIONS = [
  'TypeScript',
  'Rust',
  'Solidity',
  'Python',
  'Go',
  'Node.js',
  'React',
  'GraphQL',
  'PostgreSQL',
  'AWS',
  'Kubernetes',
  'Zero-knowledge',
  'Smart contracts',
  'Vue',
] as const;

/** The profile used to compute scores for guests who haven't registered yet. */
export const DEMO_VIEWER: ProfileInput = {
  name: 'Guest demo profile',
  stack: ['TypeScript', 'React', 'Node.js'],
  years: 4,
  hours: 20,
  policy: 'fields-on-policy',
  tier: 'yellow',
};

export const REQUIREMENTS: Requirement[] = [
  {
    id: 'req-1',
    title: 'ZK proof engineer — circuit builder',
    org: 'Nimbus Labs',
    description:
      'Design and optimize R1CS/PLONKish circuits for a private voting dapp. Strong background in constraint systems and audit experience preferred.',
    stack: ['Rust', 'Zero-knowledge', 'Smart contracts'],
    hours: 20,
    duration: '4 months',
    budget: '$6,500/mo',
    tier: 'green',
    postedAt: '2d ago',
  },
  {
    id: 'req-2',
    title: 'Full-stack TS engineer for wallet dashboard',
    org: 'Aurora Pay',
    description:
      'Build the self-custody wallet dashboard with React + GraphQL. You own features end-to-end: data fetching, optimistic UI, and realtime balance streams.',
    stack: ['TypeScript', 'React', 'GraphQL'],
    hours: 30,
    duration: '6 months',
    budget: '$8,200/mo',
    tier: 'yellow',
    postedAt: '5d ago',
  },
  {
    id: 'req-3',
    title: 'Rust backend + indexer maintainer',
    org: 'Quillchain',
    description:
      'Maintain our indexer service and transaction API. Performance-sensitive work on hot paths, with a focus on reliability and observability.',
    stack: ['Rust', 'PostgreSQL', 'AWS'],
    hours: 20,
    duration: 'Ongoing',
    budget: '$7,000/mo',
    tier: 'green',
    postedAt: '1d ago',
  },
  {
    id: 'req-4',
    title: 'Smart contract auditor (Solidity)',
    org: 'Fermion DAO',
    description:
      'Audit three DeFi contracts pre-launch: tokenomics, staking, and a novel vault strategy. Deliverables are written reports with PoC reproductions.',
    stack: ['Solidity', 'Smart contracts'],
    hours: 10,
    duration: '6 weeks',
    budget: '$12,000 total',
    tier: 'green',
    postedAt: '3d ago',
  },
  {
    id: 'req-5',
    title: 'Kubernetes platform engineer',
    org: 'Stratos Compute',
    description:
      'Run the multi-tenant K8s platform behind our GPU inference fleet. You will own cluster upgrades, autoscaling policy, and cost controls.',
    stack: ['Kubernetes', 'Go', 'AWS'],
    hours: 40,
    duration: 'Full-time',
    budget: '$140k/yr',
    tier: 'yellow',
    postedAt: '1w ago',
  },
  {
    id: 'req-6',
    title: 'Python data pipeline builder',
    org: 'Cinder Analytics',
    description:
      'Build ingestion pipelines for on-chain analytics. Batch + streaming, dbt-style modeling, and clean schemas for the analytics team.',
    stack: ['Python', 'PostgreSQL'],
    hours: 25,
    duration: '3 months',
    budget: '$5,400/mo',
    tier: 'yellow',
    postedAt: '4d ago',
  },
];

export const SAMPLE_DEVELOPERS: DeveloperProfile[] = [
  {
    id: 'dev-1',
    alias: 'A. Okoye',
    stack: ['Rust', 'Zero-knowledge', 'Smart contracts'],
    years: 8,
    hours: 25,
    tier: 'green',
    policy: 'fields-on-policy',
    github: 'aokoye',
  },
  {
    id: 'dev-2',
    alias: 'M. Chen',
    stack: ['TypeScript', 'React', 'GraphQL'],
    years: 5,
    hours: 35,
    tier: 'yellow',
    policy: 'approval-required',
  },
  {
    id: 'dev-3',
    alias: 'S. Ivanova',
    stack: ['Go', 'Kubernetes', 'AWS'],
    years: 7,
    hours: 30,
    tier: 'green',
    policy: 'score-only',
    github: 'sivanova',
  },
  {
    id: 'dev-4',
    alias: 'J. Reyes',
    stack: ['Solidity', 'Smart contracts', 'Zero-knowledge'],
    years: 3,
    hours: 15,
    tier: 'yellow',
    policy: 'fields-on-policy',
  },
];

export interface LandingTicket {
  id: string;
  devAlias: string;
  devStack: string[];
  project: string;
  projectStack: string[];
  score: number;
  tier: TrustTier;
  policy: RevealPolicy;
  blurb: string;
}

export const LANDING_TICKETS: LandingTicket[] = [
  {
    id: 'demo-1',
    devAlias: 'Ada L.',
    devStack: ['Rust', 'Zero-knowledge'],
    project: 'Nimbus Labs · ZK circuit builder',
    projectStack: ['Rust', 'Zero-knowledge'],
    score: 94,
    tier: 'green',
    policy: 'approval-required',
    blurb: 'Circuit design matched on constraint style, not on her CV.',
  },
  {
    id: 'demo-2',
    devAlias: 'K. Osei',
    devStack: ['TypeScript', 'React', 'GraphQL'],
    project: 'Aurora Pay · Wallet dashboard',
    projectStack: ['TypeScript', 'React', 'GraphQL'],
    score: 91,
    tier: 'yellow',
    policy: 'fields-on-policy',
    blurb: 'Stack overlap of 3/3 computed inside a zero-knowledge proof.',
  },
  {
    id: 'demo-3',
    devAlias: 'M. Novak',
    devStack: ['Go', 'Kubernetes'],
    project: 'Stratos · Platform engineer',
    projectStack: ['Kubernetes', 'Go'],
    score: 87,
    tier: 'green',
    policy: 'score-only',
    blurb: 'A 87/100 compatibility score. Nothing else was exchanged.',
  },
  {
    id: 'demo-4',
    devAlias: 'T. Ahmed',
    devStack: ['Solidity', 'Smart contracts'],
    project: 'Fermion DAO · Contract audit',
    projectStack: ['Solidity', 'Smart contracts'],
    score: 89,
    tier: 'yellow',
    policy: 'approval-required',
    blurb: 'Two anonymous profiles, one verifiable match ticket.',
  },
];

export const POLICY_META: Record<
  RevealPolicy,
  { label: string; blurb: string; short: string }
> = {
  'score-only': {
    label: 'Score only',
    short: 'Share a score, nothing else',
    blurb: 'Match compatibility is shared as a single number. No fields are ever revealed.',
  },
  'fields-on-policy': {
    label: 'Fields on policy',
    short: 'Auto-reveal policy-approved fields',
    blurb: 'Approved fields (e.g. stack, availability) unlock instantly on a match. Everything else stays hidden.',
  },
  'approval-required': {
    label: 'Approval required',
    short: 'Approve every reveal',
    blurb: 'Every request to see your details must be approved by you first — maximum control.',
  },
};

export const TIER_META: Record<
  TrustTier,
  { label: string; short: string; blurb: string; verifyLine: string }
> = {
  green: {
    label: 'Green tier',
    short: 'GitHub-verified',
    blurb: 'Skills are attestation-verified against GitHub. Higher trust, prioritized in match ranking.',
    verifyLine: 'Verification reward paid on attestation',
  },
  yellow: {
    label: 'Yellow tier',
    short: 'Anonymous profile',
    blurb: 'Register with no identity attached. Your commitment proves you exist — your data stays yours.',
    verifyLine: 'No verification required to start matching',
  },
};

export const HOW_IT_WORKS: {
  step: string;
  title: string;
  body: string;
}[] = [
  {
    step: '01',
    title: 'Commit',
    body: 'Your profile is hashed into a zero-knowledge commitment in your browser. The raw data never leaves your device.',
  },
  {
    step: '02',
    title: 'Match',
    body: 'The DevMatch circuit proves compatibility between two commitments — producing a match score without exposing either side.',
  },
  {
    step: '03',
    title: 'Reveal',
    body: 'You decide what happens next. Share only a score, auto-reveal policy-approved fields, or approve every request.',
  },
];

export const SEED_REWARDS: RewardsState = {
  balance: 1250,
  activities: [
    {
      id: 'rw-verify',
      kind: 'verification',
      label: 'Verification reward',
      detail: 'GitHub attestation · Green tier',
      amount: 250,
      delta: '+',
      state: 'pending',
    },
    {
      id: 'rw-deposit',
      kind: 'deposit',
      label: 'Requirement deposit',
      detail: 'Escrowed for “ZK proof engineer” match',
      amount: 100,
      delta: '-',
      state: 'pending',
    },
    {
      id: 'rw-release',
      kind: 'release',
      label: 'Match-accept release',
      detail: 'Paid when both sides accept a match',
      amount: 400,
      delta: '+',
      state: 'pending',
    },
  ] as RewardActivity[],
};

/** Base MATCH balance before any activity resolves. */
export const REWARDS_BASE = 1000;

export function initialsOf(alias: string): string {
  return alias
    .replace(/[^A-Za-z .]/g, '')
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');
}
