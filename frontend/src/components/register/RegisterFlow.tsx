/**
 * RegisterFlow — multi-step developer profile registration inside a
 * ticket-notch card.
 *
 *  1. Basics      name + stack multi-select (preset chips + custom tags)
 *  2. Experience  years + hours/week sliders
 *  3. Privacy     reveal policy selector (3 selectable cards)
 *  4. Verify      optional GitHub attestation for Green tier (skippable)
 *
 * Submit hashes the profile to a commitment in-browser and writes it through
 * the active wallet backend — showing a glowing loading state while pending
 * and an on-chain receipt (commitment + tx id) on success.
 */
import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  KeyRound,
  Loader2,
  Lock,
  Plus,
  ShieldCheck,
  Unlock,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { TicketCard } from '../ui/TicketCard';
import { Stepper } from '../ui/Stepper';
import { Chip, GhostButton, GlowButton, GitHubIcon, PolicyChip, SectionTag, TierBadge } from '../ui/primitives';
import { POLICY_META, STACK_OPTIONS } from '../../lib/data';
import type { ProfileInput, RegisteredProfile, RevealPolicy, TrustTier } from '../../lib/types';

const STEPS = ['Basics', 'Experience', 'Privacy', 'Verify'];

interface FormState {
  name: string;
  stack: string[];
  years: number;
  hours: number;
  policy: RevealPolicy;
  tier: TrustTier;
  github: string;
}

const INITIAL: FormState = {
  name: '',
  stack: [],
  years: 4,
  hours: 20,
  policy: 'fields-on-policy',
  tier: 'yellow',
  github: '',
};

const POLICY_ICONS: Record<RevealPolicy, typeof Eye> = {
  'score-only': Eye,
  'fields-on-policy': Unlock,
  'approval-required': KeyRound,
};

const YEARS_PRESETS = [0, 2, 5, 8, 12];
const HOURS_PRESETS = [10, 20, 30, 40];

export function RegisterFlow() {
  const { wallet, setWalletModalOpen, registerFlow, navigate } = useApp();
  const connected = wallet.status.kind === 'connected';

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [customTag, setCustomTag] = useState('');
  const [verifying, setVerifying] = useState(false);
  const verifyTimer = useRef<number | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<RegisteredProfile | null>(null);

  const allStacks = Array.from(new Set([...STACK_OPTIONS, ...form.stack]));
  const stepValid = step === 0 ? form.name.trim().length > 0 && form.stack.length > 0 : true;

  const toggleStack = (s: string) =>
    setForm((f) => ({
      ...f,
      stack: f.stack.includes(s) ? f.stack.filter((x) => x !== s) : [...f.stack, s],
    }));

  const addCustomTag = (e: FormEvent) => {
    e.preventDefault();
    const tag = customTag.trim();
    if (!tag) return;
    setForm((f) => ({ ...f, stack: f.stack.includes(tag) ? f.stack : [...f.stack, tag] }));
    setCustomTag('');
  };

  useEffect(() => {
    return () => {
      if (verifyTimer.current) window.clearTimeout(verifyTimer.current);
    };
  }, []);

  const runVerify = () => {
    setVerifying(true);
    verifyTimer.current = window.setTimeout(() => {
      setVerifying(false);
      setForm((f) => ({ ...f, tier: 'green', github: 'you-github' }));
    }, 1600);
  };

  const skipVerify = () => setForm((f) => ({ ...f, tier: 'yellow', github: '' }));

  const handleSubmit = async () => {
    if (!connected) {
      setSubmitError('Connect your wallet to register your profile on-chain.');
      setWalletModalOpen(true);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const input: ProfileInput = {
        name: form.name.trim(),
        stack: form.stack,
        years: form.years,
        hours: form.hours,
        policy: form.policy,
        tier: form.tier,
        github: form.github || undefined,
      };
      const res = await registerFlow(input);
      setResult(res);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Success state ─────────────────────────────────────────────────────── */
  if (result) {
    return (
      <section className="relative z-10 mx-auto max-w-2xl px-5 pb-24 pt-32 sm:pt-36">
        <TicketCard>
          <div className="flex flex-col items-center p-8 text-center sm:p-10">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-teal-bright/15 text-teal-bright shadow-[0_0_40px_rgba(125,232,208,0.35)]">
              <Check size={30} strokeWidth={3} aria-hidden="true" />
            </span>
            <h2 className="mt-5 font-display text-2xl font-extrabold tracking-tight text-mist">
              Profile committed
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
              Your zero-knowledge commitment is on the {result.network} network.
              The raw profile never left this device.
            </p>

            <div className="mt-6 w-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-faint">
                  On-chain ID
                </span>
                <div className="flex items-center gap-2">
                  <TierBadge tier={result.tier} />
                  <PolicyChip policy={result.policy} />
                </div>
              </div>
              <p className="mt-2 break-all font-mono text-xs leading-relaxed text-teal-bright">
                {result.commitment}
              </p>
              <div className="mt-3 border-t border-white/[0.07] pt-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-faint">
                  Transaction
                </span>
                <p className="mt-1 break-all font-mono text-[11px] leading-relaxed text-muted">
                  {result.txId}
                </p>
              </div>
            </div>

            <div className="mt-7 grid w-full gap-3 sm:grid-cols-2">
              <GlowButton onClick={() => navigate({ view: 'dashboard' })}>
                Browse matches
                <ArrowRight size={16} aria-hidden="true" />
              </GlowButton>
              <GhostButton onClick={() => navigate({ view: 'dashboard' })}>
                View MATCH rewards
              </GhostButton>
            </div>
          </div>
        </TicketCard>
      </section>
    );
  }

  /* ── Form ──────────────────────────────────────────────────────────────── */
  return (
    <section className="relative z-10 mx-auto max-w-2xl px-5 pb-24 pt-32 sm:pt-36">
      <SectionTag>Developer profile</SectionTag>
      <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-mist">
        Register your commitment
      </h2>
      <p className="mt-2 text-sm text-muted">
        Everything here is hashed locally into a zero-knowledge commitment.
        Only the hash is written to the ledger.
      </p>

      <div className="mt-6">
        <Stepper steps={STEPS} current={step} />
      </div>

      <TicketCard className="mt-6" innerClassName="p-6 sm:p-8">
        {/* Step 1 · Basics */}
        {step === 0 && (
          <div className="animate-fade-up space-y-6">
            <div>
              <label htmlFor="dev-name" className="mb-2 block text-sm font-semibold text-mist">
                Name <span className="font-normal text-faint">(never revealed on-chain)</span>
              </label>
              <input
                id="dev-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Ada Lovelace"
                className="w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-mist placeholder:text-faint focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/20"
              />
            </div>

            <fieldset>
              <legend className="mb-2 block text-sm font-semibold text-mist">
                Stack <span className="font-normal text-faint">(pick all that apply)</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {allStacks.map((s) => (
                  <Chip key={s} on={form.stack.includes(s)} onClick={() => toggleStack(s)}>
                    {form.stack.includes(s) && <Check size={12} strokeWidth={3} aria-hidden="true" />}
                    {s}
                  </Chip>
                ))}
                <form onSubmit={addCustomTag} className="flex items-center gap-1">
                  <input
                    type="text"
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    placeholder="Add a tag…"
                    aria-label="Add a custom stack tag"
                    className="w-28 rounded-full border border-dashed border-white/20 bg-transparent px-3 py-1.5 text-xs text-mist placeholder:text-faint focus:border-teal/50 focus:outline-none"
                  />
                  <button
                    type="submit"
                    aria-label="Add tag"
                    className="grid h-7 w-7 place-items-center rounded-full border border-white/10 text-muted transition-colors hover:border-teal/40 hover:text-teal-bright"
                  >
                    <Plus size={14} />
                  </button>
                </form>
              </div>
            </fieldset>
          </div>
        )}

        {/* Step 2 · Experience */}
        {step === 1 && (
          <div className="animate-fade-up space-y-8">
            <div>
              <div className="mb-3 flex items-end justify-between">
                <label htmlFor="years" className="text-sm font-semibold text-mist">
                  Years of experience
                </label>
                <span className="font-display text-2xl font-extrabold text-teal-bright">
                  {form.years}
                  <span className="ml-1 text-xs font-semibold text-faint">yrs</span>
                </span>
              </div>
              <input
                id="years"
                type="range"
                min={0}
                max={15}
                value={form.years}
                onChange={(e) => setForm((f) => ({ ...f, years: Number(e.target.value) }))}
                className="w-full"
                style={{ '--fill': `${(form.years / 15) * 100}%` } as CSSProperties}
              />
              <div className="mt-2 flex gap-1.5">
                {YEARS_PRESETS.map((y) => (
                  <Chip key={y} on={form.years === y} onClick={() => setForm((f) => ({ ...f, years: y }))}>
                    {y === 0 ? 'New' : `${y}+`}
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-end justify-between">
                <label htmlFor="hours" className="text-sm font-semibold text-mist">
                  Available hours per week
                </label>
                <span className="font-display text-2xl font-extrabold text-teal-bright">
                  {form.hours}
                  <span className="ml-1 text-xs font-semibold text-faint">hrs/wk</span>
                </span>
              </div>
              <input
                id="hours"
                type="range"
                min={4}
                max={40}
                step={1}
                value={form.hours}
                onChange={(e) => setForm((f) => ({ ...f, hours: Number(e.target.value) }))}
                className="w-full"
                style={{ '--fill': `${((form.hours - 4) / 36) * 100}%` } as CSSProperties}
              />
              <div className="mt-2 flex gap-1.5">
                {HOURS_PRESETS.map((h) => (
                  <Chip key={h} on={form.hours === h} onClick={() => setForm((f) => ({ ...f, hours: h }))}>
                    {h} hrs
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3 · Privacy policy */}
        {step === 2 && (
          <div className="animate-fade-up">
            <p className="mb-4 text-sm text-muted">
              This policy decides what a match is allowed to see about you.
            </p>
            <div className="grid gap-3" role="radiogroup" aria-label="Reveal policy">
              {(Object.keys(POLICY_META) as RevealPolicy[]).map((p) => {
                const Icon = POLICY_ICONS[p];
                const selected = form.policy === p;
                return (
                  <button
                    key={p}
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setForm((f) => ({ ...f, policy: p }))}
                    className={`flex items-start gap-4 rounded-2xl border p-4 text-left transition-all ${
                      selected
                        ? 'border-teal/50 bg-teal/[0.09] shadow-[0_0_24px_rgba(125,232,208,0.12)]'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/25'
                    }`}
                  >
                    <span
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${
                        selected ? 'bg-teal text-ink' : 'bg-white/[0.06] text-muted'
                      }`}
                    >
                      <Icon size={19} aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-mist">
                        {POLICY_META[p].label}
                        <span className="ml-2 text-xs font-medium text-faint">
                          {POLICY_META[p].short}
                        </span>
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-muted">
                        {POLICY_META[p].blurb}
                      </span>
                    </span>
                    {selected && (
                      <span className="ml-auto grid h-6 w-6 shrink-0 place-items-center rounded-full bg-teal-bright text-ink">
                        <Check size={13} strokeWidth={3} aria-hidden="true" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4 · GitHub verification (optional) */}
        {step === 3 && (
          <div className="animate-fade-up">
            {form.tier === 'green' && form.github ? (
              <div className="rounded-2xl border border-amber/35 bg-amber/[0.07] p-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-amber/20 text-amber-bright">
                    <ShieldCheck size={20} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-mist">GitHub verified</p>
                    <p className="text-xs text-muted">
                      Skills attestation linked to{' '}
                      <span className="font-mono text-amber-bright">@{form.github}</span>
                    </p>
                  </div>
                  <TierBadge tier="green" className="ml-auto" />
                </div>
                <p className="mt-3 text-xs leading-relaxed text-muted">
                  {POLICY_META[form.policy].blurb} Green tier is prioritized in
                  match ranking and pays the verification reward.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-center">
                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#24292f] text-white">
                    <GitHubIcon size={24} />
                  </span>
                  <p className="mt-4 text-sm font-semibold text-mist">
                    Verify with GitHub for Green tier
                  </p>
                  <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted">
                    An attestation service proves your skills against your
                    public GitHub history, without publishing anything to
                    your profile.
                  </p>
                  <GlowButton className="mt-5 w-full" onClick={runVerify} disabled={verifying}>
                    {verifying ? (
                      <>
                        <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                        Attesting…
                      </>
                    ) : (
                      <>
                        <GitHubIcon size={16} />
                        Verify with GitHub
                      </>
                    )}
                  </GlowButton>
                  <button
                    onClick={skipVerify}
                    className="mt-3 text-xs font-medium text-faint underline-offset-2 transition-colors hover:text-muted hover:underline"
                  >
                    Skip · register at Yellow tier instead
                  </button>
                </div>
              </div>
            )}

            {/* Connection status */}
            <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
              <span className="flex items-center gap-2 text-xs font-medium text-muted">
                {connected ? (
                  <>
                    <Check size={14} className="text-teal-bright" aria-hidden="true" />
                    Wallet connected
                  </>
                ) : (
                  <>
                    <Lock size={14} className="text-amber" aria-hidden="true" />
                    Wallet not connected
                  </>
                )}
              </span>
              {!connected && (
                <GhostButton size="sm" onClick={() => setWalletModalOpen(true)}>
                  Connect wallet
                </GhostButton>
              )}
            </div>

            {submitError && (
              <p
                role="alert"
                className="mt-3 rounded-xl border border-red-400/25 bg-red-400/[0.07] p-3 text-xs leading-relaxed text-red-300"
              >
                {submitError}
              </p>
            )}
          </div>
        )}

        {/* Footer navigation */}
        <div className="mt-8 flex items-center justify-between gap-3 border-t border-white/[0.07] pt-6">
          <GhostButton onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || submitting}>
            <ArrowLeft size={15} aria-hidden="true" />
            Back
          </GhostButton>

          {step < STEPS.length - 1 ? (
            <GlowButton onClick={() => setStep((s) => s + 1)} disabled={!stepValid}>
              Continue
              <ArrowRight size={15} aria-hidden="true" />
            </GlowButton>
          ) : (
            <GlowButton onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  Generating zero-knowledge proof…
                </>
              ) : (
                <>
                  <Check size={16} strokeWidth={3} aria-hidden="true" />
                  Register on-chain
                </>
              )}
            </GlowButton>
          )}
        </div>
      </TicketCard>

      {/* Glowing pending overlay */}
      {submitting && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
          <div className="flex flex-col items-center rounded-3xl border border-teal/25 bg-ink-2/95 px-10 py-8 shadow-[0_0_80px_rgba(125,232,208,0.18)] backdrop-blur-xl">
            <Loader2 size={38} className="animate-spin text-teal-bright" aria-hidden="true" />
            <p className="mt-5 text-sm font-bold text-mist">Generating zero-knowledge proof…</p>
            <p className="mt-1 text-xs text-muted">Hashing profile → proving → committing to ledger</p>
            <div className="mt-4 h-1 w-48 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="shimmer-line h-full w-full" />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
