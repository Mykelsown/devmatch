/**
 * BackgroundFX — ambient scene behind all content (pointer-events: none).
 *
 *  1. A faint particle-network canvas (thin teal lines drifting between
 *     slowly moving dots) — kept well under the 8% opacity ceiling.
 *  2. Two large blurred gradient orbs (teal + indigo).
 *  3. Hand-drawn scribble lines in the corners (decorative only).
 *
 * The canvas animates only when `prefers-reduced-motion` is not set and
 * pauses when the tab is hidden.
 */
import { useEffect, useRef } from 'react';

function Scribbles() {
  return (
    <svg
      className="pointer-events-none absolute"
      style={{ opacity: 0.05 }}
      width="340"
      height="220"
      viewBox="0 0 340 220"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 52 C 60 8, 120 96, 180 44 S 300 8, 332 58"
        stroke="#7DE8D0"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M18 140 C 70 108, 130 184, 200 132 S 300 110, 322 150"
        stroke="#4FC3E8"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M60 190 C 96 166, 140 220, 190 182 S 280 168, 310 196"
        stroke="#E8EAF6"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BackgroundFX() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let raf = 0;
    let running = true;

    interface P {
      x: number;
      y: number;
      vx: number;
      vy: number;
    }
    let particles: P[] = [];

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const seed = () => {
      const count = Math.min(42, Math.max(22, Math.round((width * height) / 42000)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const linkDist = 130;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < linkDist * linkDist) {
            const alpha = (1 - Math.sqrt(d2) / linkDist) * 0.1;
            ctx.strokeStyle = `rgba(125, 232, 208, ${alpha.toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
        ctx.fillStyle = 'rgba(125, 232, 208, 0.35)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const tick = () => {
      if (!running) return;
      draw();
      raf = requestAnimationFrame(tick);
    };

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!reduced) {
        running = true;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(tick);
      }
    };

    resize();
    seed();
    if (reduced) {
      // Static frame only — no animation loop.
      draw();
    } else {
      raf = requestAnimationFrame(tick);
    }
    window.addEventListener('resize', () => {
      resize();
      seed();
      if (reduced) draw();
    });
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <div className="bg-scene" aria-hidden="true">
      {/* Gradient orbs */}
      <div
        className="orb absolute -top-40 right-[-10%] h-[560px] w-[560px] rounded-full blur-[110px]"
        style={{
          background: 'radial-gradient(circle, rgba(79,195,232,0.16), transparent 65%)',
        }}
      />
      <div
        className="orb absolute bottom-[-20%] left-[-12%] h-[620px] w-[620px] rounded-full blur-[120px]"
        style={{
          background: 'radial-gradient(circle, rgba(21,26,69,0.9), transparent 62%)',
        }}
      />
      <div
        className="orb absolute left-[38%] top-[42%] h-[420px] w-[420px] rounded-full blur-[100px]"
        style={{
          background: 'radial-gradient(circle, rgba(242,169,60,0.05), transparent 60%)',
        }}
      />
      <canvas ref={canvasRef} />
      {/* Hand-drawn scribbles (decorative, very low opacity) */}
      <div className="absolute -left-16 top-24 -rotate-6">
        <Scribbles />
      </div>
      <div className="absolute -right-14 bottom-16 rotate-12 scale-75">
        <Scribbles />
      </div>
    </div>
  );
}
