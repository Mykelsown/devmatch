/**
 * Yellow-tier profile registration form.
 *
 * The raw profile (name, stack, years, hours) is hashed to a 32-byte
 * commitment in the browser and ONLY the digest is sent to the circuit.
 * The result view never renders raw form values — it shows the commitment,
 * the tx id, and the "Proved without revealing your input" label.
 */
import { useState, type FormEvent } from 'react';
import { RevealPolicy, Tier } from '../generated/contract/index.js';
import { hashProfileToCommitment } from '../lib/commitment';
import type { RegisterOutcome } from '../hooks/useMidnight';

const STACK_OPTIONS = [
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
] as const;

const POLICY_OPTIONS: { value: RevealPolicy; label: string }[] = [
  {
    value: RevealPolicy.ScoreOnly,
    label: 'Score only · reveal just a match score',
  },
  {
    value: RevealPolicy.FieldsOnPolicy,
    label: 'Fields on policy · reveal fields the project is allowed to see',
  },
  {
    value: RevealPolicy.ApprovalRequired,
    label: 'Approval required · ask before revealing anything',
  },
];

const YEARS_OPTIONS = [0, 1, 2, 3, 5, 8, 12] as const;
const HOURS_OPTIONS = [10, 20, 30, 40] as const;

type FormState = {
  name: string;
  stack: string[];
  years: number;
  hours: number;
  policy: RevealPolicy;
};

const INITIAL_FORM: FormState = {
  name: '',
  stack: [],
  years: 2,
  hours: 20,
  policy: RevealPolicy.ScoreOnly,
};

export function CircuitCall({
  connected,
  onRegister,
}: {
  connected: boolean;
  onRegister: (
    commitment: Uint8Array,
    tier: number,
    policy: number,
  ) => Promise<RegisterOutcome>;
}) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [outcome, setOutcome] = useState<RegisterOutcome | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const toggleStack = (option: string) => {
    setForm((f) => ({
      ...f,
      stack: f.stack.includes(option)
        ? f.stack.filter((s) => s !== option)
        : [...f.stack, option],
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || form.stack.length === 0) return;
    setSubmitting(true);
    setSubmitError(null);
    setOutcome(null);
    try {
      // Hash in-browser; only the 32-byte digest leaves this device.
      const commitment = await hashProfileToCommitment({
        name: form.name.trim(),
        stack: form.stack,
        years: form.years,
        hours: form.hours,
      });
      const result = await onRegister(commitment, Tier.Yellow, form.policy);
      setOutcome(result);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = connected && !submitting && form.name.trim().length > 0 && form.stack.length > 0;

  return (
    <section className="card circuit-card">
      <div className="card-header">
        <span className="eyebrow">Step 2</span>
        <h2>Register your developer profile</h2>
        <p className="card-sub">
          Your data is hashed locally into a zero-knowledge commitment. Only the
          hash (never the raw profile) is written to the Midnight ledger.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="profile-form">
        <label className="field">
          <span>Name</span>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Ada Lovelace"
            disabled={!connected || submitting}
            required
          />
        </label>

        <fieldset className="field">
          <legend>Stack</legend>
          <div className="chips">
            {STACK_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                className={`chip ${form.stack.includes(option) ? 'active' : ''}`}
                onClick={() => toggleStack(option)}
                disabled={!connected || submitting}
                aria-pressed={form.stack.includes(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="field-row">
          <label className="field">
            <span>Years of experience</span>
            <select
              value={form.years}
              onChange={(e) => setForm({ ...form, years: Number(e.target.value) })}
              disabled={!connected || submitting}
            >
              {YEARS_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  {y} yrs
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Hours / week</span>
            <select
              value={form.hours}
              onChange={(e) => setForm({ ...form, hours: Number(e.target.value) })}
              disabled={!connected || submitting}
            >
              {HOURS_OPTIONS.map((h) => (
                <option key={h} value={h}>
                  {h} hrs
                </option>
              ))}
            </select>
          </label>
        </div>

        <fieldset className="field">
          <legend>Reveal policy</legend>
          <div className="policy-options">
            {POLICY_OPTIONS.map(({ value, label }) => (
              <label key={value} className={`policy ${form.policy === value ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="policy"
                  checked={form.policy === value}
                  onChange={() => setForm({ ...form, policy: value })}
                  disabled={!connected || submitting}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {submitError && (
          <p className="error" role="alert">
            {submitError}
          </p>
        )}

        <button type="submit" className="btn primary block" disabled={!canSubmit || submitting}>
          {submitting ? 'Generating zero-knowledge proof…' : 'Register profile'}
        </button>
      </form>

      {outcome && (
        <div className="result" role="status">
          <div className="result-badge">
            <span className="lock-icon" aria-hidden="true">
              🔐
            </span>
            <div>
              <strong>Proved without revealing your input</strong>
              <span>
                The commitment hash (not your data) was recorded on-chain.
              </span>
            </div>
          </div>
          <dl className="result-details">
            <div>
              <dt>Commitment (SHA-256)</dt>
              <dd className="mono" title={outcome.commitment}>
                {outcome.commitment.slice(0, 24)}…{outcome.commitment.slice(-8)}
              </dd>
            </div>
            <div>
              <dt>Transaction ID</dt>
              <dd className="mono" title={outcome.txId}>
                {outcome.txId.slice(0, 24)}…{outcome.txId.slice(-8)}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </section>
  );
}
