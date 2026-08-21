/**
 * TeamRegisterFlow — multi-step team/recruiter registration.
 *
 *  Steps:
 *   1. Company/project name, description, website URL (optional)
 *   2. Required stack/skills (multi-select tags)
 *   3. Engagement type, hours/week, remote/on-site/hybrid
 *   4. Reveal policy + submit
 *
 * On completion, sets localStorage registration keys and redirects to dashboard.
 * For now, the on-chain requirement posting is stubbed with a mock transaction.
 */
import { useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Globe,
  Loader2,
  Plus,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { TicketCard } from '../ui/TicketCard';
import { Stepper } from '../ui/Stepper';
import { Chip, GhostButton, GlowButton, SectionTag } from '../ui/primitives';
import { POLICY_META, STACK_OPTIONS } from '../../lib/data';
import { PrivacyShield } from '../ui/PrivacyShield';
import type { RevealPolicy } from '../../lib/types';

const STEPS = ['Company', 'Stack', 'Engagement', 'Privacy'];

interface TeamFormState {
  companyName: string;
  description: string;
  website: string;
  requiredStack: string[];
  engagementType: string;
  minHours: number;
  workMode: string;
  policy: RevealPolicy;
}

const INITIAL: TeamFormState = {
  companyName: '',
  description: '',
  website: '',
  requiredStack: [],
  engagementType: 'Full-time',
  minHours: 20,
  workMode: 'Remote',
  policy: 'fields-on-policy',
};

const ENGAGEMENT_OPTIONS = ['Full-time', 'Part-time', 'Contract', 'Open-source bounty'];
const WORK_MODE_OPTIONS = ['Remote', 'On-site', 'Hybrid'];

function randomHex(bytes: number): string {
  const buf = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function TeamRegisterFlow() {
  const { navigate, completeRegistration } = useApp();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<TeamFormState>(INITIAL);
  const [customTag, setCustomTag] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ commitment: string; txId: string } | null>(null);

  const allStacks = Array.from(new Set([...STACK_OPTIONS, ...form.requiredStack]));
  const stepValid =
    step === 0
      ? form.companyName.trim().length > 0
      : step === 1
        ? form.requiredStack.length > 0
        : true;

  const toggleStack = (s: string) =>
    setForm((f) => ({
      ...f,
      requiredStack: f.requiredStack.includes(s)
        ? f.requiredStack.filter((x) => x !== s)
        : [...f.requiredStack, s],
    }));

  const addCustomTag = (e: FormEvent) => {
    e.preventDefault();
    const tag = customTag.trim();
    if (!tag) return;
    setForm((f) => ({
      ...f,
      requiredStack: f.requiredStack.includes(tag) ? f.requiredStack : [...f.requiredStack, tag],
    }));
    setCustomTag('');
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    // Stub: mock on-chain requirement posting (Level 3 contract, not yet deployed)
    await new Promise((r) => setTimeout(r, 1800));
    const commitment = randomHex(32);
    const txId = `0x${randomHex(32)}`;
    setResult({ commitment, txId });
    completeRegistration();
    setSubmitting(false);
  };

  /* -- Success state -- */
  if (result) {
    return (
      <section className="relative z-10 mx-auto max-w-2xl px-5 pb-24 pt-32 sm:pt-36">
        <TicketCard>
          <div className="flex flex-col items-center p-8 text-center sm:p-10">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-teal-bright/15 text-teal-bright shadow-[0_0_40px_rgba(77,182,172,0.35)]">
              <Check size={30} strokeWidth={3} aria-hidden="true" />
            </span>
            <h2 className="mt-5 font-display text-2xl font-extrabold tracking-tight text-mist">
              Requirement registered
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
              Your project requirement is committed. Developers will see it as a
              zero-knowledge compatible match.
            </p>

            <div className="mt-6 w-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-faint">
                  On-chain ID
                </span>
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

            <div className="mt-6 w-full">
              <PrivacyShield
                hiddenFields={['Company name', 'Description', 'Required stack', 'Budget']}
                provenFields={['Requirement exists', 'Policy set', 'Compatibility provable']}
                revealPolicy={form.policy}
              />
            </div>

            <div className="mt-7 grid w-full gap-3 sm:grid-cols-2">
              <GlowButton onClick={() => navigate({ view: 'dashboard' })}>
                Browse developers
                <ArrowRight size={16} aria-hidden="true" />
              </GlowButton>
              <GhostButton onClick={() => navigate({ view: 'dashboard' })}>
                View dashboard
              </GhostButton>
            </div>
          </div>
        </TicketCard>
      </section>
    );
  }

  /* -- Form -- */
  return (
    <section className="relative z-10 mx-auto max-w-2xl px-5 pb-24 pt-32 sm:pt-36">
      <SectionTag>Team profile</SectionTag>
      <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-mist">
        Register your requirement
      </h2>
      <p className="mt-2 text-sm text-muted">
        Post your project requirements as a zero-knowledge commitment.
        Developers will be matched based on compatibility.
      </p>

      <div className="mt-6">
        <Stepper steps={STEPS} current={step} />
      </div>

      <TicketCard className="mt-6" innerClassName="p-6 sm:p-8">
        {/* Step 1: Company info */}
        {step === 0 && (
          <div className="animate-fade-up space-y-6">
            <div>
              <label htmlFor="company-name" className="mb-2 block text-sm font-semibold text-mist">
                Company or project name
              </label>
              <input
                id="company-name"
                type="text"
                value={form.companyName}
                onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                placeholder="e.g. Nimbus Labs"
                className="w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-mist placeholder:text-faint focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/20"
              />
            </div>
            <div>
              <label htmlFor="company-desc" className="mb-2 block text-sm font-semibold text-mist">
                Project description
              </label>
              <textarea
                id="company-desc"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Describe your project and what you're building..."
                rows={4}
                className="w-full rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-mist placeholder:text-faint focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/20 resize-none"
              />
            </div>
            <div>
              <label htmlFor="company-website" className="mb-2 block text-sm font-semibold text-mist">
                Website URL <span className="font-normal text-faint">(optional)</span>
              </label>
              <div className="relative">
                <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" aria-hidden="true" />
                <input
                  id="company-website"
                  type="url"
                  value={form.website}
                  onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                  placeholder="https://nimbuslabs.io"
                  className="w-full rounded-2xl border border-white/12 bg-white/[0.04] py-3 pl-10 pr-4 text-mist placeholder:text-faint focus:border-teal/50 focus:outline-none focus:ring-2 focus:ring-teal/20"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Required stack */}
        {step === 1 && (
          <div className="animate-fade-up space-y-6">
            <fieldset>
              <legend className="mb-2 block text-sm font-semibold text-mist">
                What stack/skills are you looking for? <span className="font-normal text-faint">(pick all that apply)</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {allStacks.map((s) => (
                  <Chip key={s} on={form.requiredStack.includes(s)} onClick={() => toggleStack(s)}>
                    {form.requiredStack.includes(s) && <Check size={12} strokeWidth={3} aria-hidden="true" />}
                    {s}
                  </Chip>
                ))}
                <form onSubmit={addCustomTag} className="flex items-center gap-1">
                  <input
                    type="text"
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    placeholder="Add a tag..."
                    aria-label="Add a custom skill tag"
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

        {/* Step 3: Engagement type */}
        {step === 2 && (
          <div className="animate-fade-up space-y-8">
            <div>
              <p className="mb-3 text-sm font-semibold text-mist">Engagement type</p>
              <div className="grid grid-cols-2 gap-2.5">
                {ENGAGEMENT_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setForm((f) => ({ ...f, engagementType: opt }))}
                    className={`rounded-2xl border p-3.5 text-center text-sm font-medium transition-all ${
                      form.engagementType === opt
                        ? 'border-teal/45 bg-teal/[0.08] text-teal-bright'
                        : 'border-white/10 bg-white/[0.02] text-muted hover:border-white/20 hover:text-mist'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-end justify-between">
                <label htmlFor="min-hours" className="text-sm font-semibold text-mist">
                  Minimum hours per week
                </label>
                <span className="font-display text-2xl font-extrabold text-teal-bright">
                  {form.minHours}
                  <span className="ml-1 text-xs font-semibold text-faint">hrs/wk</span>
                </span>
              </div>
              <input
                id="min-hours"
                type="range"
                min={4}
                max={40}
                step={1}
                value={form.minHours}
                onChange={(e) => setForm((f) => ({ ...f, minHours: Number(e.target.value) }))}
                className="w-full"
                style={{ '--fill': `${((form.minHours - 4) / 36) * 100}%` } as React.CSSProperties}
              />
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-mist">Work mode</p>
              <div className="flex gap-2.5">
                {WORK_MODE_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setForm((f) => ({ ...f, workMode: opt }))}
                    className={`flex-1 rounded-2xl border p-3.5 text-center text-sm font-medium transition-all ${
                      form.workMode === opt
                        ? 'border-teal/45 bg-teal/[0.08] text-teal-bright'
                        : 'border-white/10 bg-white/[0.02] text-muted hover:border-white/20 hover:text-mist'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Reveal policy */}
        {step === 3 && (
          <div className="animate-fade-up">
            <p className="mb-4 text-sm text-muted">
              This policy decides what a matched developer is allowed to see about your requirement.
            </p>
            <div className="grid gap-3" role="radiogroup" aria-label="Reveal policy">
              {(Object.keys(POLICY_META) as RevealPolicy[]).map((p) => {
                const selected = form.policy === p;
                return (
                  <button
                    key={p}
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setForm((f) => ({ ...f, policy: p }))}
                    className={`flex items-start gap-4 rounded-2xl border p-4 text-left transition-all ${
                      selected
                        ? 'border-teal/50 bg-teal/[0.09] shadow-[0_0_24px_rgba(77,182,172,0.12)]'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/25'
                    }`}
                  >
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
                  Committing requirement...
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

      {/* Submitting overlay */}
      {submitting && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
          <div className="flex flex-col items-center rounded-3xl border border-teal/25 bg-surface/95 px-10 py-8 shadow-[0_0_80px_rgba(77,182,172,0.18)] backdrop-blur-xl">
            <Loader2 size={38} className="animate-spin text-teal-bright" aria-hidden="true" />
            <p className="mt-5 text-sm font-bold text-mist">Committing requirement...</p>
            <p className="mt-1 text-xs text-muted">Hashing data, generating proof, committing to ledger</p>
            <div className="mt-4 h-1 w-48 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="shimmer-line h-full w-full" />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
