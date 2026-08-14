/**
 * Small shared UI primitives used across the app.
 */
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { BadgeCheck, Lock, Shield } from 'lucide-react';
import type { RevealPolicy, TrustTier } from '../../lib/types';
import { POLICY_META } from '../../lib/data';

/* ─── Buttons ─────────────────────────────────────────────────────────────── */

type ButtonSize = 'sm' | 'md' | 'lg';

const GLOW_SIZES: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-[15px]',
  lg: 'px-8 py-3.5 text-base',
};

const GHOST_SIZES: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function GlowButton({
  size = 'md',
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { size?: ButtonSize }) {
  return (
    <button className={`btn-glow ${GLOW_SIZES[size]} ${className ?? ''}`} {...rest}>
      {children}
    </button>
  );
}

export function GhostButton({
  size = 'md',
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { size?: ButtonSize }) {
  return (
    <button className={`btn-pill ${GHOST_SIZES[size]} ${className ?? ''}`} {...rest}>
      {children}
    </button>
  );
}

export function Chip({
  on = false,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { on?: boolean }) {
  return (
    <button
      type="button"
      className={`chip ${on ? 'chip-on' : ''} ${className ?? ''}`}
      aria-pressed={on}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ─── Badges & tags ───────────────────────────────────────────────────────── */

export function TierBadge({ tier, className }: { tier: TrustTier; className?: string }) {
  if (tier === 'green') {
    // Amber is reserved for Green-tier verification badges.
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border border-amber/40 bg-amber/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-bright ${className ?? ''}`}
      >
        <BadgeCheck size={13} strokeWidth={2.5} aria-hidden="true" />
        Green
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-muted ${className ?? ''}`}
    >
      <Shield size={13} strokeWidth={2.5} aria-hidden="true" />
      Yellow
    </span>
  );
}

export function PolicyChip({ policy, className }: { policy: RevealPolicy; className?: string }) {
  const meta = POLICY_META[policy];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-muted ${className ?? ''}`}
      title={meta.blurb}
    >
      <Lock size={11} aria-hidden="true" />
      {meta.label}
    </span>
  );
}

export function SectionTag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-amber/30 bg-amber/[0.08] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-bright ${className ?? ''}`}
    >
      {children}
    </span>
  );
}

/* ─── GitHub brand mark (not in lucide) ───────────────────────────────────── */

export function GitHubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} aria-hidden="true">
      <path
        fill="currentColor"
        d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
      />
    </svg>
  );
}
