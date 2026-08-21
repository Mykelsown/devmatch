/**
 * ScoreTag — the glowing compatibility score badge.
 *
 * A circular progress ring (teal gradient) around a bold percentage. Used as
 * the pinned "price tag" on ticket cards and at large size on the match
 * detail view.
 */
import { useId } from 'react';

export function ScoreTag({
  score,
  size = 'md',
  className,
}: {
  score: number;
  size?: 'md' | 'lg';
  className?: string;
}) {
  const uid = useId();
  const dim = size === 'lg' ? 116 : 58;
  const stroke = size === 'lg' ? 7 : 5;
  const r = (dim - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(100, Math.max(0, score)) / 100);

  return (
    <div
      role="img"
      aria-label={`${score}% match score`}
      className={`relative grid place-items-center rounded-full border bg-ink/90 ${
        size === 'lg'
          ? 'border-teal/30 shadow-[0_0_48px_rgba(125,232,208,0.28)]'
          : 'border-teal/25 shadow-[0_0_22px_rgba(125,232,208,0.25)]'
      } ${className ?? ''}`}
      style={{ width: dim, height: dim }}
    >
      <svg
        className="absolute inset-0 -rotate-90"
        width={dim}
        height={dim}
        viewBox={`0 0 ${dim} ${dim}`}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={uid} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1A5F6B" />
            <stop offset="100%" stopColor="#4DB6AC" />
          </linearGradient>
        </defs>
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={r}
          stroke="rgba(125,232,208,0.14)"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={r}
          stroke={`url(#${uid})`}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="flex flex-col items-center leading-none">
        <span
          className="font-display font-extrabold tabular-nums text-mist"
          style={{ fontSize: size === 'lg' ? 34 : 17 }}
        >
          {score}
        </span>
        {size === 'lg' && (
          <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-teal">
            match
          </span>
        )}
      </div>
    </div>
  );
}
