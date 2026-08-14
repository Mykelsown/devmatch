/**
 * HowItWorks — three steps: Commit → Match → Reveal.
 */
import { KeyRound, ScanFace, Unlock } from 'lucide-react';
import { SectionTag } from '../ui/primitives';
import { Reveal } from '../ui/Reveal';
import { HOW_IT_WORKS } from '../../lib/data';

const ICONS = [ScanFace, KeyRound, Unlock];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative mx-auto max-w-6xl scroll-mt-28 px-5 py-16">
      <Reveal>
        <div className="max-w-2xl">
          <SectionTag>How it works</SectionTag>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-mist sm:text-4xl">
            Three steps. Zero exposure.
          </h2>
        </div>
      </Reveal>

      <div className="relative mt-12 grid gap-6 md:grid-cols-3">
        {/* connector line (desktop) */}
        <div
          className="absolute left-[16%] right-[16%] top-[52px] hidden h-px bg-gradient-to-r from-teal/0 via-teal/40 to-teal/0 md:block"
          aria-hidden="true"
        />
        {HOW_IT_WORKS.map((s, i) => {
          const Icon = ICONS[i];
          return (
            <Reveal key={s.step} delay={i * 90}>
              <div className="group relative h-full rounded-3xl border border-white/10 bg-panel/50 p-6 backdrop-blur-sm transition-colors duration-300 hover:border-teal/30">
                <div className="flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-full border border-teal/30 bg-teal/[0.08] text-teal transition-shadow duration-300 group-hover:shadow-[0_0_24px_rgba(125,232,208,0.3)]">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <span className="font-display text-4xl font-extrabold text-white/[0.07]">
                    {s.step}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-lg font-bold text-mist">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
