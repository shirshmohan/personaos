"use client";

import { useEffect, useRef } from "react";

/**
 * The space the travel page lives in: layered stars, parallax drift, and the
 * occasional shooting star. No nebula — the colour belongs to the planet.
 *
 * Drawn on a plain 2D canvas rather than WebGL — the map already owns a GPU
 * context, and a mostly-static field doesn't need a second one. One rAF loop,
 * no layout, dead cheap.
 *
 *
 * prefers-reduced-motion paints one still frame and stops (D39).
 */

interface Star {
  x: number;
  y: number;
  r: number;
  /** 0 = far and still, 1 = near and drifting. */
  depth: number;
  alpha: number;
  /** Slight colour variation — real star fields aren't monochrome. */
  hue: string;
}

interface Shooting {
  x: number;
  y: number;
  len: number;
  life: number;
}

/** Deterministic: the sky must not reshuffle on every re-render. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export function SpaceBackdrop({
  dark,
  fixed = false,
}: {
  dark: boolean;
  /** Cover the whole viewport rather than just the parent box. */
  fixed?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !dark) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rand = seeded(20260717);

    let w = 0;
    let h = 0;
    let stars: Star[] = [];

    function build() {
      const parent = canvas!.parentElement;
      if (!parent) return;
      w = fixed ? window.innerWidth : parent.clientWidth;
      h = fixed ? window.innerHeight : parent.clientHeight;
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Density scales with area, so a wide screen isn't emptier than a phone.
      const count = Math.round((w * h) / 4200);
      stars = Array.from({ length: count }, () => {
        const depth = rand();
        const tint = rand();
        return {
          x: rand() * w,
          y: rand() * h,
          // A few large blurred ones close; the rest are pinpricks.
          r: depth > 0.95 ? 1.6 + rand() * 1.9 : 0.3 + rand() * 0.7,
          depth,
          alpha: 0.2 + rand() * 0.6,
          hue:
            tint > 0.85 ? "190,205,255" : tint < 0.12 ? "255,220,200" : "225,236,255",
        };
      });
    }

    let shooting: Shooting | null = null;
    let nextShot = 0;
    let raf = 0;
    let t = 0;

    function frame(now: number) {
      ctx!.clearRect(0, 0, w, h);

      for (const s of stars) {
        // Parallax: near stars drift, distant ones effectively don't.
        const drift = reduce ? 0 : (t * 0.0035 * s.depth) % (w + 10);
        const x = s.x - drift < -5 ? s.x - drift + w + 10 : s.x - drift;

        if (s.r > 1.5) {
          const g = ctx!.createRadialGradient(x, s.y, 0, x, s.y, s.r * 4);
          g.addColorStop(0, `rgba(${s.hue},${s.alpha * 0.5})`);
          g.addColorStop(1, `rgba(${s.hue},0)`);
          ctx!.fillStyle = g;
          ctx!.beginPath();
          ctx!.arc(x, s.y, s.r * 4, 0, Math.PI * 2);
          ctx!.fill();
        }
        ctx!.fillStyle = `rgba(${s.hue},${s.alpha})`;
        ctx!.beginPath();
        ctx!.arc(x, s.y, s.r, 0, Math.PI * 2);
        ctx!.fill();
      }

      if (!reduce) {
        // One shooting star every 10–15s, gone in about a second.
        if (!shooting && now > nextShot) {
          shooting = {
            x: rand() * w * 0.7,
            y: rand() * h * 0.5,
            len: 60 + rand() * 70,
            life: 1,
          };
        }
        if (shooting) {
          const s = shooting;
          const g = ctx!.createLinearGradient(
            s.x, s.y, s.x + s.len, s.y + s.len * 0.6,
          );
          g.addColorStop(0, `rgba(255,255,255,${s.life * 0.9})`);
          g.addColorStop(1, "rgba(255,255,255,0)");
          ctx!.strokeStyle = g;
          ctx!.lineWidth = 1.4;
          ctx!.beginPath();
          ctx!.moveTo(s.x, s.y);
          ctx!.lineTo(s.x + s.len, s.y + s.len * 0.6);
          ctx!.stroke();

          s.x += 9;
          s.y += 5.4;
          s.life -= 0.02;
          if (s.life <= 0) {
            shooting = null;
            nextShot = now + 10000 + rand() * 5000;
          }
        }
        t += 1;
        raf = requestAnimationFrame(frame);
      }
    }

    build();
    nextShot = performance.now() + 3000;
    raf = requestAnimationFrame(frame);

    const onResize = () => {
      build();
      if (reduce) frame(performance.now());
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [dark, fixed]);

  // A daylit sky with stars in it is nonsense.
  if (!dark) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={
        fixed
          ? "pointer-events-none fixed inset-0 z-0 h-full w-full"
          : "pointer-events-none absolute inset-0 h-full w-full"
      }
    />
  );
}
