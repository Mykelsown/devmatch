/**
 * TicketCard — DevMatch's signature card shape.
 *
 * A glassmorphic panel with semicircular notches cut into the left and right
 * edges, like a physical event ticket. The soft outer glow lives on an
 * unmasked wrapper (`filter: drop-shadow`) so it follows the notched
 * silhouette exactly. Every profile, requirement, and match card is built on
 * this.
 */
import type { MouseEvent as ReactMouseEvent, MouseEventHandler, ReactNode } from 'react';

export function TicketCard({
  children,
  className,
  innerClassName,
  onClick,
  interactive = false,
  label,
}: {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
  interactive?: boolean;
  label?: string;
}) {
  return (
    <div
      className={`ticket-glow ${interactive ? 'cursor-pointer' : ''} ${className ?? ''}`}
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={label}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.(e as unknown as ReactMouseEvent<HTMLDivElement>);
              }
            }
          : undefined
      }
    >
      <div
        className={`ticket glass relative flex flex-col overflow-hidden ${innerClassName ?? ''}`}
      >
        {children}
      </div>
    </div>
  );
}
