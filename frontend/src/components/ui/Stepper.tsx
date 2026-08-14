/**
 * Stepper — the registration flow progress indicator.
 * Completed steps show a check, the current step glows teal.
 */
import { Check } from 'lucide-react';

export function Stepper({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <ol className="flex items-center" aria-label="Registration progress">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className={`flex items-center ${i < steps.length - 1 ? 'flex-1' : ''}`}>
            <div
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? 'border-teal/40 bg-teal/15 text-teal-bright'
                  : done
                    ? 'border-transparent text-teal-bright/70'
                    : 'border-white/10 text-faint'
              }`}
              aria-current={active ? 'step' : undefined}
            >
              <span
                className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold ${
                  done
                    ? 'bg-teal-bright text-ink'
                    : active
                      ? 'bg-teal text-ink'
                      : 'bg-white/10 text-faint'
                }`}
              >
                {done ? <Check size={12} strokeWidth={3.5} aria-hidden="true" /> : i + 1}
              </span>
              <span className="hidden sm:inline">{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`mx-2 h-px flex-1 ${done ? 'bg-teal/50' : 'bg-white/10'}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
