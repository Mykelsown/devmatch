/**
 * Sidebar — narrow icon-only nav rail for the authenticated dashboard area.
 *
 * 64px wide, dark surface background, rounded icon buttons with Lucide icons.
 * Active state: teal-tinted icon with a small vertical accent bar on the left edge.
 * Always visible once the user is registered and logged in.
 */
import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  GitMerge,
  Settings,
} from 'lucide-react';

export type SidebarSection = 'dashboard' | 'developers' | 'requirements' | 'matches' | 'settings';

const NAV_ITEMS: { id: SidebarSection; icon: typeof LayoutDashboard; label: string }[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'developers', icon: Users, label: 'Developers' },
  { id: 'requirements', icon: Briefcase, label: 'Requirements' },
  { id: 'matches', icon: GitMerge, label: 'Matches' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];

export function Sidebar({
  activeSection,
  onNavigate,
}: {
  activeSection: SidebarSection;
  onNavigate: (section: SidebarSection) => void;
}) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <aside
      className="fixed inset-y-0 left-0 z-30 flex w-16 flex-col items-center border-r border-white/[0.06] bg-surface py-4"
      aria-label="Dashboard navigation"
    >
      {/* Logo */}
      <div className="mb-6 grid h-10 w-10 place-items-center">
        <img
          src="/devmatch-icon-eclipse.svg"
          alt="DevMatch"
          width={32}
          height={32}
          className="h-8 w-8"
        />
      </div>

      {/* Nav items */}
      <nav className="flex flex-1 flex-col items-center gap-1.5">
        {NAV_ITEMS.map(({ id, icon: Icon, label }) => {
          const isActive = activeSection === id;
          const isHovered = hoveredItem === id;
          return (
            <div key={id} className="relative">
              {/* Active accent bar */}
              {isActive && (
                <div className="absolute -left-[1px] top-1.5 bottom-1.5 w-[3px] rounded-full bg-teal-bright" />
              )}

              <button
                onClick={() => onNavigate(id)}
                onMouseEnter={() => setHoveredItem(id)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`relative grid h-10 w-10 place-items-center rounded-xl transition-colors ${
                  isActive
                    ? 'bg-teal/15 text-teal-bright'
                    : 'text-muted hover:bg-white/[0.05] hover:text-mist'
                }`}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
                title={label}
              >
                <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} aria-hidden="true" />
              </button>

              {/* Tooltip on hover */}
              {isHovered && !isActive && (
                <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-ink-2 px-3 py-1.5 text-xs font-medium text-mist shadow-lg">
                  {label}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
