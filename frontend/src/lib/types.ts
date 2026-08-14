/**
 * Shared domain types for the DevMatch frontend.
 *
 * Everything in this file is UI/data-plane types — independent of the wallet
 * backend so the Midnight integration can be swapped for the demo backend (or
 * vice versa) without touching the components.
 */

/** What a reveal policy allows a match to see. */
export type RevealPolicy = 'score-only' | 'fields-on-policy' | 'approval-required';

/** Trust tier: anonymous (yellow) or GitHub-verified (green). */
export type TrustTier = 'yellow' | 'green';

/** Which side of the marketplace the current user is browsing as. */
export type Role = 'dev' | 'team';

/** The profile a developer registers (the raw data never leaves the device). */
export interface ProfileInput {
  name: string;
  stack: string[];
  years: number;
  hours: number;
  policy: RevealPolicy;
  tier: TrustTier;
  github?: string;
}

/** A successfully committed profile, with its on-chain receipt. */
export interface RegisteredProfile extends ProfileInput {
  id: string;
  commitment: string;
  txId: string;
  network: string;
  registeredAt: string;
}

/** A requirement posted by a team, browsed by developers. */
export interface Requirement {
  id: string;
  title: string;
  org: string;
  description: string;
  stack: string[];
  hours: number;
  duration: string;
  budget: string;
  tier: TrustTier;
  postedAt: string;
}

/** A developer profile card, browsed by teams. */
export interface DeveloperProfile {
  id: string;
  alias: string;
  stack: string[];
  years: number;
  hours: number;
  tier: TrustTier;
  policy: RevealPolicy;
  github?: string;
  isViewer?: boolean;
}

/** The counterpart of a match — either a requirement or a developer. */
export interface MatchSubject {
  kind: 'requirement' | 'developer';
  id: string;
  title: string;
  subtitle: string;
  description: string;
  stack: string[];
  meta: { label: string; value: string }[];
  tier: TrustTier;
}

/** A computed compatibility match between the viewer and a subject. */
export interface Match {
  id: string;
  subject: MatchSubject;
  score: number;
  policy: RevealPolicy;
  hiddenFields: string[];
  matchedAt: string;
}

/** Reveal flow phase for a single match. */
export type RevealPhase = 'locked' | 'requested' | 'revealed';

/** Match accept/decline decision. */
export type Decision = 'accepted' | 'declined' | null;

export type RewardKind = 'verification' | 'deposit' | 'release';

export interface RewardActivity {
  id: string;
  kind: RewardKind;
  label: string;
  detail: string;
  amount: number;
  delta: '+' | '-';
  state: 'pending' | 'completed';
}

export interface RewardsState {
  balance: number;
  activities: RewardActivity[];
}

/** Snapshot of the connected wallet shown in the UI. */
export interface WalletSnapshot {
  address: string;
  shortAddress: string;
  balance: string;
  network: string;
  mode: 'midnight' | 'mock';
}

/** Result of an on-chain (or demo) profile registration. */
export interface RegisterResult {
  commitment: string;
  txId: string;
  tier: TrustTier;
  policy: RevealPolicy;
  network: string;
}
