/**
 * FloatingActionBar — small rounded pill fixed to the bottom-right.
 *
 * Contains three icon buttons: post a requirement (Plus), browse matches
 * (Layers), and settings (SlidersHorizontal). Teal background on hover.
 */
import { Plus, Layers, SlidersHorizontal } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { SidebarSection } from '../layout/Sidebar';

const ACTIONS: {
  icon: typeof Plus;
  label: string;
  section: SidebarSection;
}[] = [
  { icon: Plus, label: 'Post requirement', section: 'requirements' },
  { icon: Layers, label: 'Browse matches', section: 'matches' },
  { icon: SlidersHorizontal, label: 'Settings', section: 'settings' },
];

export function FloatingActionBar() {
  const { setDashboardSection } = useApp();

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <div className="flex items-center gap-1 rounded-full border border-white/[0.08] bg-surface/90 px-2 py-1.5 shadow-lg backdrop-blur-xl">
        {ACTIONS.map(({ icon: Icon, label, section }) => (
          <button
            key={section}
            onClick={() => setDashboardSection(section)}
            className="grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-teal/15 hover:text-teal-bright"
            aria-label={label}
            title={label}
          >
            <Icon size={17} aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );
}
