/**
 * RoleSelection — full-screen role selection for unauthenticated users.
 *
 * Shown when no registration record exists in localStorage. Two large cards
 * side by side: "I am a Developer" and "I am a Team / Recruiter".
 * Teal border on hover. Clicking one sets the role and moves to registration.
 */
import { Code, Briefcase, ArrowRight } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { Role } from '../../lib/types';

const ROLES: {
  role: Role;
  title: string;
  description: string;
  icon: typeof Code;
  features: string[];
}[] = [
  {
    role: 'dev',
    title: 'I am a Developer',
    description: 'Register your skills, stack, and availability as a zero-knowledge commitment. Get matched with projects without exposing your raw profile.',
    icon: Code,
    features: [
      'Register skills as a ZK commitment',
      'Get matched with project requirements',
      'Choose what to reveal on each match',
    ],
  },
  {
    role: 'team',
    title: 'I am a Team / Recruiter',
    description: 'Post your project requirements and find developers whose profiles are compatible, proven by a ZK circuit without revealing either side.',
    icon: Briefcase,
    features: [
      'Post project requirements on-chain',
      'Browse compatible developer profiles',
      'Zero-knowledge proof of compatibility',
    ],
  },
];

export function RoleSelection() {
  const { setRole, navigate } = useApp();

  const selectRole = (role: Role) => {
    setRole(role);
    // Persist the role selection before moving to registration
    localStorage.setItem('devmatch:userRole', role);
    navigate({ view: 'register' });
  };

  return (
    <section className="relative z-10 flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-3xl">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber/30 bg-amber/[0.08] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-amber">
            Get started
          </span>
          <h1 className="mt-5 font-display text-3xl font-extrabold tracking-tight text-mist sm:text-4xl">
            Choose your role
          </h1>
          <p className="mt-3 text-sm text-muted">
            DevMatch matches developers and teams using zero-knowledge proofs.
            Select your role to get started.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {ROLES.map(({ role, title, description, icon: Icon, features }) => (
            <button
              key={role}
              onClick={() => selectRole(role)}
              className="group flex flex-col rounded-2xl border border-white/[0.08] bg-surface p-6 text-left transition-all duration-200 hover:-translate-y-1 hover:border-teal/40 hover:bg-surface-alt hover:shadow-[0_0_40px_rgba(26,95,107,0.12)]"
            >
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-teal/15 text-teal-bright transition-colors group-hover:bg-teal/25">
                <Icon size={22} aria-hidden="true" />
              </span>
              <h2 className="mt-4 font-display text-lg font-bold text-mist">
                {title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {description}
              </p>

              <ul className="mt-4 flex-1 space-y-2">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-muted">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-bright" />
                    {f}
                  </li>
                ))}
              </ul>

              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-teal-bright transition-colors group-hover:text-teal-bright">
                Get started
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
