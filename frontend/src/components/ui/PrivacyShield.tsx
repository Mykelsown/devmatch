/**
 * PrivacyShield — observable privacy behavior indicator.
 *
 * Shows users what's hidden vs what's proven, making the privacy
 * guarantee tangible and visible. This is the "something proven
 * without being shown" requirement.
 *
 * The component displays:
 * - Which fields are hidden (never revealed)
 * - Which fields are proven by the circuit
 * - A visual shield icon indicating privacy protection
 */
import { EyeOff, Shield, Lock, Check } from 'lucide-react';

interface PrivacyShieldProps {
  /** What's being hidden from the match */
  hiddenFields: string[];
  /** What the circuit proved */
  provenFields: string[];
  /** The reveal policy controlling what can be shown */
  revealPolicy: 'score-only' | 'fields-on-policy' | 'approval-required';
}

export function PrivacyShield({
  hiddenFields,
  provenFields,
  revealPolicy,
}: PrivacyShieldProps) {
  return (
    <div className="rounded-2xl border border-teal/25 bg-teal/[0.05] p-4">
      <div className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-teal/15 text-teal-bright">
          <Shield size={18} aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-bold text-teal-bright">
            Privacy Shield Active
          </p>
          <p className="text-xs text-muted">
            Your data is protected by zero-knowledge proofs
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {/* Hidden fields */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-faint">
            <EyeOff size={12} aria-hidden="true" />
            Always Hidden
          </p>
          <ul className="mt-2 space-y-1.5">
            {hiddenFields.map((field) => (
              <li key={field} className="flex items-center gap-2 text-xs text-muted">
                <Lock size={10} className="text-faint" aria-hidden="true" />
                {field}
              </li>
            ))}
          </ul>
        </div>

        {/* Proven fields */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-faint">
            <Check size={12} className="text-teal" aria-hidden="true" />
            Proven by Circuit
          </p>
          <ul className="mt-2 space-y-1.5">
            {provenFields.map((field) => (
              <li key={field} className="flex items-center gap-2 text-xs text-teal-bright">
                <Check size={10} strokeWidth={3} className="text-teal" aria-hidden="true" />
                {field}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-3 text-[10px] leading-relaxed text-faint">
        {revealPolicy === 'score-only' && (
          <>Only the compatibility score was shared. No personal data was revealed.</>
        )}
        {revealPolicy === 'fields-on-policy' && (
          <>Policy-approved fields unlock on match. Everything else stays hidden.</>
        )}
        {revealPolicy === 'approval-required' && (
          <>Every field reveal requires your explicit approval.</>
        )}
      </p>
    </div>
  );
}
