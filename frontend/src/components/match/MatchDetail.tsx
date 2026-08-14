/**
 * MatchDetail — the reveal flow.
 *
 * The compatibility score is front and center. What happens next depends on
 * the reveal policy:
 *   - FieldsOnPolicy      → fields unlock immediately + note on what's hidden
 *   - ApprovalRequired    → Request reveal pill → pending → unlocked
 *   - ScoreOnly           → the score is all this match will ever share
 * Accept/decline are paired pill buttons; accepting releases the MATCH
 * deposit + match-accept reward.
 */
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Search,
  Sparkles,
  Unlock,
} from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { TicketCard } from '../ui/TicketCard';
import { ScoreTag } from '../ui/ScoreTag';
import { GhostButton, GlowButton, PolicyChip, SectionTag, TierBadge } from '../ui/primitives';
import { POLICY_META } from '../../lib/data';
import type { Match } from '../../lib/types';

function RevealedFields({ match }: { match: Match }) {
  const subj = match.subject;
  return (
    <div className="animate-fade-up rounded-2xl border border-teal/20 bg-teal/[0.04] p-5">
      <p className="flex items-center gap-2 text-sm font-bold text-teal-bright">
        <Unlock size={15} aria-hidden="true" />
        Revealed fields
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {subj.stack.map((s) => (
          <span
            key={s}
            className="rounded-full border border-teal/25 bg-teal/[0.08] px-3 py-1 text-xs font-semibold text-teal-bright"
          >
            {s}
          </span>
        ))}
      </div>
      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        {subj.meta.map((m) => (
          <div key={m.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <dt className="text-[10px] font-bold uppercase tracking-wider text-faint">{m.label}</dt>
            <dd className="mt-1 text-sm font-semibold text-mist">{m.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-xs leading-relaxed text-faint">
        Still hidden: {match.hiddenFields.join(', ')}. Only the match score was
        proven by the circuit. These fields were released by policy.
      </p>
    </div>
  );
}

export function MatchDetail({ id }: { id: string }) {
  const { getMatch, revealPhase, requestReveal, decisions, decide, navigate } = useApp();
  const match = getMatch(id);

  if (!match) {
    return (
      <section className="relative z-10 mx-auto max-w-2xl px-5 pb-24 pt-40 text-center">
        <Search size={36} className="mx-auto text-faint" aria-hidden="true" />
        <h2 className="mt-4 font-display text-2xl font-extrabold text-mist">Match not found</h2>
        <p className="mt-2 text-sm text-muted">This match ticket doesn't exist or was closed.</p>
        <GhostButton className="mt-6" onClick={() => navigate({ view: 'dashboard' })}>
          <ArrowLeft size={15} aria-hidden="true" />
          Back to matches
        </GhostButton>
      </section>
    );
  }

  const subj = match.subject;
  const phase = revealPhase(id);
  const decision = decisions[id] ?? null;

  return (
    <section className="relative z-10 mx-auto max-w-3xl px-5 pb-24 pt-32 sm:pt-36">
      <GhostButton size="sm" onClick={() => navigate({ view: 'dashboard' })}>
        <ArrowLeft size={15} aria-hidden="true" />
        All matches
      </GhostButton>

      <TicketCard className="mt-5" innerClassName="p-6 sm:p-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTag>Match ticket</SectionTag>
          <div className="flex items-center gap-2">
            <TierBadge tier={subj.tier} />
            <PolicyChip policy={match.policy} />
          </div>
        </div>

        {/* Score + subject */}
        <div className="mt-7 flex flex-col items-center gap-7 sm:flex-row sm:items-start">
          <div className="flex flex-col items-center gap-3">
            <ScoreTag score={match.score} size="lg" />
            <p className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-faint">
              Compatibility score
            </p>
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-mist sm:text-[28px]">
              {subj.title}
            </h2>
            <p className="mt-1 text-sm font-semibold text-teal">{subj.subtitle}</p>
            <p className="mt-3 text-sm leading-relaxed text-muted">{subj.description}</p>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-faint sm:justify-start">
              <Sparkles size={13} className="text-teal" aria-hidden="true" />
              Proven by the DevMatch circuit from both commitments. No raw
              data was exchanged.
            </p>
          </div>
        </div>

        <div className="perf my-6" />

        {/* Reveal flow */}
        <div className="space-y-4">
          {match.policy === 'fields-on-policy' && (
            <>
              <RevealedFields match={match} />
              <p className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-xs leading-relaxed text-muted">
                {POLICY_META['fields-on-policy'].short}. Revealed automatically
                on match. No approval needed from you.
              </p>
            </>
          )}

          {match.policy === 'approval-required' && phase === 'locked' && (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-white/[0.06] text-muted">
                <Lock size={20} aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-bold text-mist">Details locked</p>
                <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted">
                  {POLICY_META['approval-required'].blurb} Send a reveal request
                  to unlock their fields.
                </p>
              </div>
              <GlowButton onClick={() => requestReveal(id)}>
                <Eye size={16} aria-hidden="true" />
                Request reveal
              </GlowButton>
            </div>
          )}

          {match.policy === 'approval-required' && phase === 'requested' && (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-amber/30 bg-amber/[0.05] p-6 text-center">
              <Loader2 size={24} className="animate-spin text-amber" aria-hidden="true" />
              <div>
                <p className="text-sm font-bold text-mist">Request sent · waiting for approval…</p>
                <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted">
                  The other side can approve or deny. You'll see their fields
                  the moment they approve. (Demo: auto-approves in a moment.)
                </p>
              </div>
            </div>
          )}

          {match.policy === 'approval-required' && phase === 'revealed' && (
            <>
              <RevealedFields match={match} />
              <p className="rounded-xl border border-teal/20 bg-teal/[0.05] px-4 py-3 text-xs leading-relaxed text-teal-bright">
                <Check size={13} className="mr-1 inline" strokeWidth={3} aria-hidden="true" />
                Reveal approved. Fields unlocked for this match only.
              </p>
            </>
          )}

          {match.policy === 'score-only' && (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-white/[0.06] text-muted">
                <EyeOff size={20} aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-bold text-mist">Score-only match</p>
                <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted">
                  {POLICY_META['score-only'].blurb} That number is everything
                  this match will ever share.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="perf my-6" />

        {/* Accept / decline */}
        {!decision && (
          <div className="flex flex-col gap-3 sm:flex-row">
            <GlowButton className="flex-1" onClick={() => decide(id, 'accepted')}>
              <Check size={16} strokeWidth={3} aria-hidden="true" />
              Accept match
            </GlowButton>
            <GhostButton className="flex-1" onClick={() => decide(id, 'declined')}>
              Decline
            </GhostButton>
          </div>
        )}

        {decision === 'accepted' && (
          <div className="animate-fade-up rounded-2xl border border-teal/30 bg-teal/[0.07] p-5">
            <p className="flex items-center gap-2 text-sm font-bold text-teal-bright">
              <Check size={16} strokeWidth={3} aria-hidden="true" />
              Match accepted
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Requirement deposit released and the match-accept reward paid.
              check the MATCH panel on the dashboard. The other side gets a
              copy of this ticket with the same score.
            </p>
          </div>
        )}

        {decision === 'declined' && (
          <div className="animate-fade-up rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-sm font-semibold text-muted">
            Match declined. Nothing was revealed and no tokens moved.
          </div>
        )}
      </TicketCard>
    </section>
  );
}
