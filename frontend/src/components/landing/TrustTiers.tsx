/**
 * TrustTiers — Green (GitHub-verified, amber badge) vs Yellow (anonymous, gray
 * badge) side-by-side explainer cards. Amber is reserved for Green tier
 * verification badges only.
 */
import { ArrowRight, BadgeCheck, Shield } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { TicketCard } from '../ui/TicketCard';
import { GhostButton, SectionTag } from '../ui/primitives';
import { Reveal } from '../ui/Reveal';

const GREEN_FEATURES = [
  'Skills attestation-verified against GitHub',
  'Prioritized in match ranking',
  'Paid verification reward on attestation',
];

const YELLOW_FEATURES = [
  'Register with no identity attached',
  'Score-only matching by default',
  'Zero personal data on the ledger',
];

export function TrustTiers() {
  const { navigate } = useApp();

  return (
    <section className="relative mx-auto max-w-6xl px-5 py-16">
      <Reveal>
        <div className="max-w-2xl">
          <SectionTag>Trust tiers</SectionTag>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-mist sm:text-4xl">
            Choose how much you verify.
          </h2>
          <p className="mt-3 text-muted">
            Both tiers match through the same zero-knowledge circuit. Green
            just adds a verifiable GitHub attestation on top.
          </p>
        </div>
      </Reveal>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {/* Green tier */}
        <Reveal delay={0}>
          <TicketCard className="h-full">
            <div className="p-6 pb-5">
              <div className="flex items-start justify-between gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-amber/15 text-amber-bright">
                  <BadgeCheck size={22} aria-hidden="true" />
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber/40 bg-amber/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-bright">
                  <BadgeCheck size={13} aria-hidden="true" />
                  GitHub-verified
                </span>
              </div>
              <h3 className="mt-4 font-display text-xl font-bold text-mist">Green tier</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Skills are attestation-verified against your GitHub history.
                Teams see a verified signal, and you still control what gets
                revealed.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-mist/90">
                {GREEN_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <ArrowRight size={14} className="mt-0.5 shrink-0 text-amber" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="perf mt-0" />
            <div className="p-6 pt-4">
              <GhostButton onClick={() => navigate({ view: 'register' })} className="w-full">
                Verify with GitHub
                <ArrowRight size={15} aria-hidden="true" />
              </GhostButton>
            </div>
          </TicketCard>
        </Reveal>

        {/* Yellow tier */}
        <Reveal delay={90}>
          <TicketCard className="h-full">
            <div className="p-6 pb-5">
              <div className="flex items-start justify-between gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-white/[0.06] text-muted">
                  <Shield size={22} aria-hidden="true" />
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-muted">
                  <Shield size={13} aria-hidden="true" />
                  Anonymous profile
                </span>
              </div>
              <h3 className="mt-4 font-display text-xl font-bold text-mist">Yellow tier</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Register with no identity attached. Your commitment proves you
                exist and match. Your data stays yours, always.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-mist/90">
                {YELLOW_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <ArrowRight size={14} className="mt-0.5 shrink-0 text-teal" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="perf mt-0" />
            <div className="p-6 pt-4">
              <GhostButton onClick={() => navigate({ view: 'register' })} className="w-full">
                Register free
                <ArrowRight size={15} aria-hidden="true" />
              </GhostButton>
            </div>
          </TicketCard>
        </Reveal>
      </div>
    </section>
  );
}
