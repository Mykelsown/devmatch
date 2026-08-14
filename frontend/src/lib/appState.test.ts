/**
 * Unit tests for the pure domain logic in lib/appState.ts — scoring, match
 * building (including reveal-policy gating), and the reveal/decide/rewards
 * state transitions that AppContext wires into React state.
 */
import { describe, expect, it } from 'vitest';
import {
  applyDecisionToActivities,
  approveRevealPhase,
  buildDeveloperMatches,
  buildRequirementMatches,
  computeRewardsBalance,
  computeScore,
  markVerificationCompleted,
  requestRevealPhase,
  type RevealPhaseMap,
} from './appState';
import {
  DEMO_VIEWER,
  REWARDS_BASE,
  REQUIREMENTS,
  SAMPLE_DEVELOPERS,
  SEED_REWARDS,
} from './data';
import type { DeveloperProfile, ProfileInput } from './types';

const SKILLED: ProfileInput = {
  name: 'Tester',
  stack: ['Rust', 'Zero-knowledge'],
  years: 8,
  hours: 20,
  policy: 'fields-on-policy',
  tier: 'green',
};

describe('computeScore', () => {
  it('returns the 99 cap for a perfect stack match with high experience', () => {
    expect(computeScore(SKILLED, ['Rust', 'Zero-knowledge'])).toBe(99);
  });

  it('returns the 55 floor for zero overlap and no experience', () => {
    const noob: ProfileInput = { ...SKILLED, stack: ['Python'], years: 0 };
    expect(computeScore(noob, ['Rust', 'Go', 'Solidity'])).toBe(55);
  });

  it('returns a neutral 62 for an empty subject stack', () => {
    expect(computeScore(SKILLED, [])).toBe(62);
  });

  it('rewards experience: more years → higher score for the same overlap', () => {
    const junior = { ...SKILLED, years: 1 };
    const senior = { ...SKILLED, years: 10 };
    expect(computeScore(senior, ['Rust'])).toBeGreaterThan(computeScore(junior, ['Rust']));
  });

  it('never leaves the [55, 99] band', () => {
    const subjects = [
      ['Rust'],
      ['Rust', 'Go', 'Solidity', 'TypeScript', 'React'],
      ['Python', 'PostgreSQL'],
      ['Kubernetes'],
    ];
    for (const subject of subjects) {
      const score = computeScore(SKILLED, subject);
      expect(score).toBeGreaterThanOrEqual(55);
      expect(score).toBeLessThanOrEqual(99);
    }
  });

  it('gives the demo viewer a high score against its own stack', () => {
    expect(computeScore(DEMO_VIEWER, DEMO_VIEWER.stack)).toBeGreaterThanOrEqual(90);
  });
});

describe('reveal flow transitions', () => {
  it('request flips locked → requested, leaving the original map untouched', () => {
    const phases: RevealPhaseMap = { 'm-a': 'locked' };
    const next = requestRevealPhase(phases, 'm-a');
    expect(next['m-a']).toBe('requested');
    expect(phases['m-a']).toBe('locked');
  });

  it('approval flips requested → revealed', () => {
    expect(approveRevealPhase({ 'm-a': 'requested' }, 'm-a')['m-a']).toBe('revealed');
  });

  it('approval can also arrive for a still-locked match', () => {
    expect(approveRevealPhase({}, 'm-a')['m-a']).toBe('revealed');
  });

  it('models the full request → approve lifecycle', () => {
    let phases: RevealPhaseMap = {};
    phases = requestRevealPhase(phases, 'm-1');
    phases = approveRevealPhase(phases, 'm-1');
    expect(phases['m-1']).toBe('revealed');
  });

  it('is immutable: unrelated ids are preserved', () => {
    const next = requestRevealPhase({ 'm-b': 'revealed' }, 'm-a');
    expect(next['m-b']).toBe('revealed');
  });
});

describe('decide → rewards transitions', () => {
  const stateOf = (acts: typeof SEED_REWARDS.activities) =>
    Object.fromEntries(acts.map((a) => [a.id, a.state]));

  it('accepting completes the deposit and release activities only', () => {
    const next = applyDecisionToActivities(SEED_REWARDS.activities, 'accepted');
    const byId = stateOf(next);
    expect(byId['rw-deposit']).toBe('completed');
    expect(byId['rw-release']).toBe('completed');
    expect(byId['rw-verify']).toBe('pending');
  });

  it('declining leaves every activity untouched (same array identity)', () => {
    const next = applyDecisionToActivities(SEED_REWARDS.activities, 'declined');
    expect(next).toBe(SEED_REWARDS.activities);
  });

  it('markVerificationCompleted completes only the verification reward', () => {
    const byId = stateOf(markVerificationCompleted(SEED_REWARDS.activities));
    expect(byId['rw-verify']).toBe('completed');
    expect(byId['rw-deposit']).toBe('pending');
    expect(byId['rw-release']).toBe('pending');
  });

  it('balance starts at the base while everything is pending', () => {
    expect(computeRewardsBalance(SEED_REWARDS.activities)).toBe(REWARDS_BASE);
  });

  it('verification pays +250', () => {
    expect(computeRewardsBalance(markVerificationCompleted(SEED_REWARDS.activities))).toBe(
      REWARDS_BASE + 250,
    );
  });

  it('an accepted match nets −100 deposit + +400 release', () => {
    const after = applyDecisionToActivities(SEED_REWARDS.activities, 'accepted');
    expect(computeRewardsBalance(after)).toBe(REWARDS_BASE - 100 + 400);
  });

  it('green-tier verify + accept lands at 1550', () => {
    let acts = markVerificationCompleted(SEED_REWARDS.activities);
    acts = applyDecisionToActivities(acts, 'accepted');
    expect(computeRewardsBalance(acts)).toBe(1550);
  });

  it('respects a custom base', () => {
    expect(computeRewardsBalance(SEED_REWARDS.activities, 0)).toBe(0);
  });
});

describe('match building', () => {
  it('builds one ticket per seeded requirement', () => {
    expect(buildRequirementMatches(DEMO_VIEWER)).toHaveLength(REQUIREMENTS.length);
  });

  it('derives the reveal policy from the poster tier', () => {
    const byId = Object.fromEntries(
      buildRequirementMatches(DEMO_VIEWER).map((m) => [m.id, m.policy]),
    );
    expect(byId['m-req-1']).toBe('fields-on-policy'); // green poster
    expect(byId['m-req-2']).toBe('approval-required'); // yellow poster
  });

  it('every requirement ticket carries meta, hidden fields, and a bounded score', () => {
    for (const m of buildRequirementMatches(DEMO_VIEWER)) {
      expect(m.subject.meta).toHaveLength(3);
      expect(m.hiddenFields.length).toBeGreaterThan(0);
      expect(m.score).toBeGreaterThanOrEqual(55);
      expect(m.score).toBeLessThanOrEqual(99);
    }
  });

  it('masks years/hours in the card copy for locked developer policies', () => {
    const byId = Object.fromEntries(
      buildDeveloperMatches(DEMO_VIEWER, null).map((m) => [m.subject.id, m]),
    );
    // dev-3 is score-only: no experience/availability anywhere in the copy
    expect(byId['dev-3'].subject.subtitle).toBe('Score-only profile');
    expect(byId['dev-3'].subject.description).not.toMatch(/yrs|years|hours/);
    // dev-2 is approval-required
    expect(byId['dev-2'].subject.subtitle).toBe('Details locked · request reveal');
    // dev-1 is fields-on-policy: experience is visible
    expect(byId['dev-1'].subject.subtitle).toMatch(/yrs/);
  });

  it('prepends the viewer’s own profile when provided', () => {
    const own: DeveloperProfile = {
      id: 'me',
      alias: 'Ada L.',
      stack: ['Rust'],
      years: 5,
      hours: 20,
      tier: 'green',
      policy: 'fields-on-policy',
    };
    const matches = buildDeveloperMatches(DEMO_VIEWER, own);
    expect(matches[0].subject.id).toBe('me');
    expect(matches).toHaveLength(1 + SAMPLE_DEVELOPERS.length);
  });
});
