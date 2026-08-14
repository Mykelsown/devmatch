/**
 * Tests for the signature ticket-notch card.
 *
 * Rendering is asserted via react-dom/server (no DOM needed), and a
 * regression guard keeps the notch mask + glow classes in styles.css — the
 * mask is what actually cuts the semicircular notches, so losing it would
 * silently flatten DevMatch's visual identity.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { TicketCard } from './TicketCard';

// Read the stylesheet directly: vitest's default `css: false` stubs CSS
// imports (including ?raw) to an empty module, so we bypass the pipeline.
const stylesCss = readFileSync(fileURLToPath(new URL('../../styles.css', import.meta.url)), 'utf8');

describe('TicketCard rendering', () => {
  it('renders the glow wrapper around the masked ticket surface', () => {
    const html = renderToStaticMarkup(<TicketCard>Hello</TicketCard>);
    expect(html).toContain('ticket-glow');
    expect(html).toContain('ticket glass relative flex flex-col overflow-hidden');
    expect(html).toContain('Hello');
  });

  it('passes className to the wrapper and innerClassName to the surface', () => {
    const html = renderToStaticMarkup(
      <TicketCard className="w-72" innerClassName="p-6">
        X
      </TicketCard>,
    );
    expect(html).toContain('ticket-glow');
    expect(html).toContain('w-72');
    expect(html).toContain('ticket glass relative flex flex-col overflow-hidden p-6');
  });

  it('is a plain panel by default — no button semantics', () => {
    const html = renderToStaticMarkup(<TicketCard>X</TicketCard>);
    expect(html).not.toContain('role="button"');
    expect(html).not.toContain('tabindex');
  });

  it('adds button semantics and a label when interactive', () => {
    const html = renderToStaticMarkup(<TicketCard interactive label="Open match">X</TicketCard>);
    expect(html).toContain('role="button"');
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('aria-label="Open match"');
  });
});

describe('ticket-notch styles (regression guard)', () => {
  it('keeps the signature notch mask + glow + reduced-motion handling in styles.css', () => {
    expect(stylesCss).toContain('.ticket {');
    expect(stylesCss).toContain('-webkit-mask-composite: source-in');
    expect(stylesCss).toContain('mask-composite: intersect');
    expect(stylesCss).toContain('.ticket-glow');
    expect(stylesCss).toContain('--notch');
    expect(stylesCss).toContain('@media (prefers-reduced-motion: reduce)');
  });
});
