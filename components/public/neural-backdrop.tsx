"use client";

import { useEffect, useRef } from "react";
import { subscribeGraphFocus, type GraphFocus } from "@/features/train/graph-focus";

/**
 * The environment the pattern graph lives inside: enormous, out-of-focus neuron
 * structures, occasional synapses firing, a few drifting particles.
 *
 * The whole design constraint is subordination. This sits at 5–10% intensity
 * and never competes with the graph — if you notice it before you notice the
 * nodes, it has failed. Everything moves slowly enough that you shouldn't spot
 * the motion until you look for it.
 *
 * PERFORMANCE — the reason this holds 60fps:
 * neurons never change shape, only position and brightness. So each layer is
 * grown once, blurred once into an offscreen canvas, and then merely blitted at
 * a parallax offset each frame. Per-frame blur of branching structures would be
 * hopeless; blitting two bitmaps is nothing. Only synapses and particles — a
 * handful of small dots — are drawn live.
 */

const NAVY = "#070B14";
const ELECTRIC = "78,168,255"; // #4EA8FF
const CYAN = "127,232,255"; // #7FE8FF
const VIOLET = "123,108,255"; // #7B6CFF

interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  w: number;
}

interface Layer {
  sprite: HTMLCanvasElement | null;
  segments: Segment[];
  /** How far this layer slides with the cursor. Far layers barely move. */
  parallax: number;
  opacity: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
  /** Set when pulled toward a hovered node; fades after arriving. */
  pulled: boolean;
}

interface Pulse {
  seg: Segment;
  /** 0 → 1 along the segment. */
  t: number;
  speed: number;
  rgb: string;
}

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/** Grow one dendrite recursively. Branching, thinning, slightly wandering. */
function grow(
  segments: Segment[],
  x: number,
  y: number,
  angle: number,
  len: number,
  width: number,
  depth: number,
  rand: () => number,
): void {
  if (depth <= 0 || len < 8) return;
  const x2 = x + Math.cos(angle) * len;
  const y2 = y + Math.sin(angle) * len;
  segments.push({ x1: x, y1: y, x2, y2, w: width });

  // Two children usually, one sometimes — regular enough to read as a dendrite,
  // irregular enough not to look like a fractal demo.
  const branches = rand() > 0.25 ? 2 : 1;
  for (let i = 0; i < branches; i++) {
    const spread = (rand() - 0.5) * 1.1;
    grow(
      segments,
      x2,
      y2,
      angle + spread,
      len * (0.62 + rand() * 0.22),
      width * 0.68,
      depth - 1,
      rand,
    );
  }
}

/** A soma plus its dendrites, planted anywhere — including off-screen, so the
 *  structures read as parts of something far bigger than the viewport. */
function growNeuron(
  segments: Segment[],
  cx: number,
  cy: number,
  scale: number,
  rand: () => number,
): void {
  const arms = 4 + Math.floor(rand() * 3);
  for (let i = 0; i < arms; i++) {
    const angle = (i / arms) * Math.PI * 2 + rand() * 0.6;
    grow(segments, cx, cy, angle, 120 * scale, 7 * scale, 5, rand);
  }
}

export function NeuralBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rand = seeded(19980417);

    let w = 0;
    let h = 0;
    let layers: Layer[] = [];
    let particles: Particle[] = [];
    let pulses: Pulse[] = [];
    let nextPulse = 0;

    // Cursor, smoothed. Raw pointer values would make the parallax twitch.
    let targetMx = 0;
    let targetMy = 0;
    let mx = 0;
    let my = 0;

    let focus: GraphFocus = { x: 0, y: 0, active: false };
    /** Eased toward 1 while a node is hovered, so brightening never snaps. */
    let activation = 0;

    /** Grow a layer, then bake it: blur is a one-time cost, not a per-frame one. */
    function bake(
      segments: Segment[],
      blur: number,
      rgb: string,
    ): HTMLCanvasElement | null {
      const off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      const c = off.getContext("2d");
      if (!c) return null;
      c.filter = `blur(${blur}px)`;
      c.strokeStyle = `rgb(${rgb})`;
      c.lineCap = "round";
      for (const s of segments) {
        c.lineWidth = s.w;
        c.beginPath();
        c.moveTo(s.x1, s.y1);
        c.lineTo(s.x2, s.y2);
        c.stroke();
      }
      return off;
    }

    function build() {
      w = window.innerWidth;
      h = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Layer 1 — enormous and hopelessly out of focus. Planted well outside
      // the viewport so you only ever see part of any structure.
      const far: Segment[] = [];
      for (let i = 0; i < 3; i++) {
        growNeuron(far, (rand() * 1.8 - 0.4) * w, (rand() * 1.8 - 0.4) * h, 2.4, rand);
      }

      // Layer 2 — mid-distance, legible as neurons. Synapses fire along these.
      const mid: Segment[] = [];
      for (let i = 0; i < 5; i++) {
        growNeuron(mid, (rand() * 1.4 - 0.2) * w, (rand() * 1.4 - 0.2) * h, 1.1, rand);
      }

      layers = [
        { sprite: bake(far, 26, ELECTRIC), segments: far, parallax: 2, opacity: 0.07 },
        { sprite: bake(mid, 7, ELECTRIC), segments: mid, parallax: 5, opacity: 0.1 },
      ];

      particles = Array.from({ length: 34 }, () => ({
        x: rand() * w,
        y: rand() * h,
        vx: (rand() - 0.5) * 0.09,
        vy: (rand() - 0.5) * 0.09,
        r: 0.6 + rand() * 1.3,
        alpha: 0.15 + rand() * 0.4,
        pulled: false,
      }));
      pulses = [];
    }

    /** One impulse, along a random branch of the mid layer. */
    function fire(rgb = CYAN) {
      const mid = layers[1];
      if (!mid || mid.segments.length === 0) return;
      const seg = mid.segments[Math.floor(rand() * mid.segments.length)];
      pulses.push({ seg, t: 0, speed: 0.006 + rand() * 0.008, rgb });
    }

    let raf = 0;

    function frame(now: number) {
      ctx!.clearRect(0, 0, w, h);

      // Ease everything. Nothing here is allowed to snap.
      mx += (targetMx - mx) * 0.05;
      my += (targetMy - my) * 0.05;
      activation += ((focus.active ? 1 : 0) - activation) * 0.06;

      // Layers: blitted, not redrawn. Movement is 3–5px — looking through
      // glass, not moving the scene.
      for (const layer of layers) {
        if (!layer.sprite) continue;
        ctx!.globalAlpha = layer.opacity;
        ctx!.drawImage(layer.sprite, mx * layer.parallax, my * layer.parallax);
      }
      ctx!.globalAlpha = 1;

      // A hovered node lights the tissue immediately around it — the graph
      // appearing to activate the network it grew out of.
      if (activation > 0.01) {
        const g = ctx!.createRadialGradient(
          focus.x, focus.y, 0, focus.x, focus.y, 210,
        );
        g.addColorStop(0, `rgba(${VIOLET},${0.1 * activation})`);
        g.addColorStop(0.5, `rgba(${ELECTRIC},${0.05 * activation})`);
        g.addColorStop(1, `rgba(${ELECTRIC},0)`);
        ctx!.fillStyle = g;
        ctx!.fillRect(focus.x - 210, focus.y - 210, 420, 420);
      }

      // Synapses.
      if (!reduce && now > nextPulse) {
        fire();
        nextPulse = now + 4000 + rand() * 6000; // 4–10s, per the brief
      }
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        p.t += reduce ? 0 : p.speed;
        if (p.t >= 1) {
          pulses.splice(i, 1);
          continue;
        }
        const x = p.seg.x1 + (p.seg.x2 - p.seg.x1) * p.t + mx * 5;
        const y = p.seg.y1 + (p.seg.y2 - p.seg.y1) * p.t + my * 5;
        // Brightest mid-travel, so it arrives and leaves without a hard edge.
        const life = Math.sin(p.t * Math.PI);
        const g = ctx!.createRadialGradient(x, y, 0, x, y, 7);
        g.addColorStop(0, `rgba(${p.rgb},${0.55 * life})`);
        g.addColorStop(1, `rgba(${p.rgb},0)`);
        ctx!.fillStyle = g;
        ctx!.beginPath();
        ctx!.arc(x, y, 7, 0, Math.PI * 2);
        ctx!.fill();
      }

      // Particles.
      for (const p of particles) {
        if (!reduce) {
          if (focus.active) {
            // Drawn toward the live node, then released.
            const dx = focus.x - p.x;
            const dy = focus.y - p.y;
            const d = Math.hypot(dx, dy);
            if (d < 260 && d > 4) {
              p.vx += (dx / d) * 0.004;
              p.vy += (dy / d) * 0.004;
              p.pulled = true;
            }
          } else if (p.pulled) {
            // Settle back to a drift rather than stopping dead.
            p.vx *= 0.985;
            p.vy *= 0.985;
            if (Math.hypot(p.vx, p.vy) < 0.05) p.pulled = false;
          }
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < -10) p.x = w + 10;
          if (p.x > w + 10) p.x = -10;
          if (p.y < -10) p.y = h + 10;
          if (p.y > h + 10) p.y = -10;
        }

        const a = p.pulled ? Math.min(p.alpha * 2.2, 0.75) : p.alpha;
        const g = ctx!.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3.5);
        g.addColorStop(0, `rgba(${CYAN},${a})`);
        g.addColorStop(1, `rgba(${CYAN},0)`);
        ctx!.fillStyle = g;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r * 3.5, 0, Math.PI * 2);
        ctx!.fill();
      }

      if (!reduce) raf = requestAnimationFrame(frame);
    }

    build();
    nextPulse = performance.now() + 2000;
    raf = requestAnimationFrame(frame);

    const onPointer = (e: PointerEvent) => {
      // Normalised to roughly -1..1, so parallax lands at 3–5px, not 300.
      targetMx = (e.clientX / window.innerWidth - 0.5) * 2;
      targetMy = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    const unsubscribe = subscribeGraphFocus((f) => {
      const wasActive = focus.active;
      focus = f;
      // One synapse fires the moment a node is entered — the network noticing.
      if (f.active && !wasActive && !reduce) fire(VIOLET);
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
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 40%, #0B132B 0%, ${NAVY} 70%)`,
        }}
      />
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 h-full w-full"
      />
    </>
  );
}
