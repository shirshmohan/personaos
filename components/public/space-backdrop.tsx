"use client";

import { useEffect, useRef } from "react";
import { subscribeGlobeCamera } from "@/features/travel/globe-camera";

/**
 * The space the travel page lives in: layered stars, a few colour clusters, and
 * the occasional shooting star.
 *
 * The field is anchored to the SKY, not the screen. Spin the globe and the
 * stars slide the other way, because you are the one turning — that's the whole
 * difference between a starfield and wallpaper.
 *
 * Drawn on a plain 2D canvas rather than WebGL: the map already owns a GPU
 * context, and this is a few hundred circles. One rAF loop, no layout.
 * prefers-reduced-motion paints one still frame and stops (D39).
 */

interface Star {
  x: number;
  y: number;
  r: number;
  /** 0 = far and barely moves, 1 = near and swings with the camera. */
  depth: number;
  alpha: number;
  /** Real star fields aren't monochrome. */
  hue: string;
}

interface Cluster {
  x: number;
  y: number;
  r: number;
  rgb: string;
  depth: number;
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

/**
 * Distant gas, in a few places only.
 *
 * An earlier pass tinted the ENTIRE sky violet, which just made the page look
 * like it had a filter on. Real colour in space is patchy — so these are small,
 * local, and most of the sky stays black.
 */
const CLUSTERS: Omit<Cluster, "x" | "y">[] = [
  { r: 150, rgb: "255,138,66", depth: 0.35 }, // orange
  { r: 190, rgb: "150,88,224", depth: 0.5 }, // purple
  { r: 120, rgb: "255,170,90", depth: 0.7 }, // amber, closer
  { r: 165, rgb: "120,70,200", depth: 0.25 }, // deep violet, far
];

/** How far the sky swings for a full turn of the globe, in screen-widths. */
const SKY_TRAVEL = 4;

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
    let clusters: Cluster[] = [];
    let sprites: HTMLCanvasElement[] = [];
    // Where the globe is pointing. Read every frame, never re-rendered.
    let camLng = 0;

    /** Clusters are big soft gradients — expensive to draw, identical every
     *  frame. Render once, then blit. */
    function makeSprite(c: Cluster): HTMLCanvasElement {
      const size = c.r * 2;
      const off = document.createElement("canvas");
      off.width = size;
      off.height = size;
      const g = off.getContext("2d");
      if (g) {
        const grad = g.createRadialGradient(c.r, c.r, 0, c.r, c.r, c.r);
        grad.addColorStop(0, `rgba(${c.rgb},0.16)`);
        grad.addColorStop(0.45, `rgba(${c.rgb},0.06)`);
        grad.addColorStop(1, `rgba(${c.rgb},0)`);
        g.fillStyle = grad;
        g.fillRect(0, 0, size, size);
      }
      return off;
    }

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

      const count = Math.round((w * h) / 4200);
      stars = Array.from({ length: count }, () => {
        const depth = rand();
        const tint = rand();
        return {
          x: rand() * w,
          y: rand() * h,
          r: depth > 0.95 ? 1.6 + rand() * 1.9 : 0.3 + rand() * 0.7,
          depth,
          alpha: 0.2 + rand() * 0.6,
          hue:
            tint > 0.85 ? "190,205,255" : tint < 0.12 ? "255,220,200" : "225,236,255",
        };
      });

      clusters = CLUSTERS.map((c) => ({
        ...c,
        x: rand() * w,
        y: 0.1 * h + rand() * 0.8 * h,
      }));
      sprites = clusters.map(makeSprite);
    }

    /** Wrap a position into [0, w) so the sky is seamless as it swings. */
    function wrap(x: number): number {
      return ((x % w) + w) % w;
    }

    /** Longitude -> how far this depth has slid. Near things move more. */
    function shift(depth: number): number {
      return (camLng / 360) * w * SKY_TRAVEL * (0.35 + depth * 0.65);
    }

    let shooting: Shooting | null = null;
    let nextShot = 0;
    let raf = 0;

    function frame(now: number) {
      ctx!.clearRect(0, 0, w, h);

      // Gas first — the stars sit in front of it.
      for (let i = 0; i < clusters.length; i++) {
        const c = clusters[i];
        const s = sprites[i];
        const x = wrap(c.x + shift(c.depth));
        // Drawn twice near the seam, so a cluster never pops at the edge.
        ctx!.drawImage(s, x - c.r, c.y - c.r);
        if (x + c.r > w) ctx!.drawImage(s, x - c.r - w, c.y - c.r);
        if (x - c.r < 0) ctx!.drawImage(s, x - c.r + w, c.y - c.r);
      }

      for (const st of stars) {
        const x = wrap(st.x + shift(st.depth));
        if (st.r > 1.5) {
          const g = ctx!.createRadialGradient(x, st.y, 0, x, st.y, st.r * 4);
          g.addColorStop(0, `rgba(${st.hue},${st.alpha * 0.5})`);
          g.addColorStop(1, `rgba(${st.hue},0)`);
          ctx!.fillStyle = g;
          ctx!.beginPath();
          ctx!.arc(x, st.y, st.r * 4, 0, Math.PI * 2);
          ctx!.fill();
        }
        ctx!.fillStyle = `rgba(${st.hue},${st.alpha})`;
        ctx!.beginPath();
        ctx!.arc(x, st.y, st.r, 0, Math.PI * 2);
        ctx!.fill();
      }

      if (!reduce) {
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
          const g = ctx!.createLinearGradient(s.x, s.y, s.x + s.len, s.y + s.len * 0.6);
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
        raf = requestAnimationFrame(frame);
      }
    }

    build();
    nextShot = performance.now() + 3000;
    raf = requestAnimationFrame(frame);

    // Follow the globe. Under reduced motion we still track it — the sky moving
    // when YOU turn isn't decoration, it's whether the scene makes sense.
    const unsubscribe = subscribeGlobeCamera((c) => {
      camLng = c.lng;
      if (reduce) frame(performance.now());
    });

    const onResize = () => {
      build();
      if (reduce) frame(performance.now());
    };
    window.addEventListener("resize", onResize);

    return () => {
      unsubscribe();
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
