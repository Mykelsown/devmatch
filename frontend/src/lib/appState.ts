/**
 * Pure domain logic for the DevMatch UI.
 *
 * Everything here is a plain function with no React or network dependencies,
 * which makes the scoring, match building, reveal, and rewards transitions
 * directly unit-testable. `AppContext` is the only React wiring layer — it
 * calls these functions and holds the resulting state.
 */
import { REWARDS_BASE, REQUIREMENTS, SAMPLE_DEVELOPERS } from './data';
import type {
  DeveloperProfile,
  Match,
  ProfileInput,
  RevealPhase,
  RevealPolicy,
  RewardActivity,
} from './types';

/**
 * Compatibility score: stack coverage dominates (0–40 pts), experience adds a
 * small bonus (capped at 6), and the result is clamped to [55, 99]. An empty
 * subject stack yields a neutral 62.
 */
export function computeScore(viewer: ProfileInput, subjectStack: string[]): number {
  if (subjectStack.length === 0) return 62;
  const overlap = subjectStack.filter((s) => viewer.stack.includes(s)).length;
  const coverage = overlap / subjectStack.length;
  const base = 55 + coverage * 40;
  const yearBonus = Math.min(6, Math.max(0, viewer.years - 1) * 0.9);
  return Math.max(55, Math.min(99, Math.round(base + yearBonus)));
}

export function hiddenFieldsFor(kind: 'requirement' | 'developer'): string[] {
  return kind === 'requirement'
    ? ['Budget figures', 'Team size', 'Reviewer notes']
    : ['Full name', 'GitHub handle', 'Current employer'];
}

/** Build the developer-view match tickets for every seeded requirement. */
export function buildRequirementMatches(viewer: ProfileInput): Match[] {
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

/** Build the team-view match tickets for seeded developers (+ the viewer's own profile). */
export function buildDeveloperMatches(viewer: ProfileInput, own: DeveloperProfile | null): Match[] {
  const devs = own ? [own, ...SAMPLE_DEVELOPERS] : SAMPLE_DEVELOPERS;
  return devs.map((dev) => {
    // Locked policies must not leak years/hours into the card copy.
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

/* ─── Reveal flow transitions ─────────────────────────────────────────────── */

export type RevealPhaseMap = Record<string, RevealPhase>;

/** A reveal request flips the match phase from locked → requested. */
export function requestRevealPhase(phases: RevealPhaseMap, id: string): RevealPhaseMap {
  return { ...phases, [id]: 'requested' };
}

/** An approval (or auto-approval) flips the phase to revealed. */
export function approveRevealPhase(phases: RevealPhaseMap, id: string): RevealPhaseMap {
  return { ...phases, [id]: 'revealed' };
}

/* ─── Rewards transitions ─────────────────────────────────────────────────── */

/** Completing the GitHub attestation pays the verification reward. */
export function markVerificationCompleted(activities: RewardActivity[]): RewardActivity[] {
  return activities.map((a) => (a.id === 'rw-verify' ? { ...a, state: 'completed' } : a));
}

/**
 * Applying a decision resolves the deposit + release flows when the match is
 * accepted; declining leaves every activity untouched.
 */
export function applyDecisionToActivities(
  activities: RewardActivity[],
  decision: 'accepted' | 'declined',
): RewardActivity[] {
  if (decision !== 'accepted') return activities;
  return activities.map((a) =>
    a.id === 'rw-deposit' || a.id === 'rw-release' ? { ...a, state: 'completed' } : a,
  );
}

/** Balance = base + completed deltas (pending activity is not counted). */
export function computeRewardsBalance(
  activities: RewardActivity[],
  base: number = REWARDS_BASE,
): number {
  return activities.reduce(
    (acc, a) => (a.state === 'completed' ? acc + (a.delta === '+' ? a.amount : -a.amount) : acc),
    base,
  );
}

