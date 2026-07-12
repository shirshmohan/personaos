"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY,
} from "d3-force";
import type { Graph, GraphNode } from "@/features/atlas/graph";
import type { EntityType } from "@/lib/db/schema";

interface SimNode extends GraphNode { x: number; y: number; }
const TYPE_HUE: Record<EntityType, number> = {
  career: 250, writing: 200, travel: 150, train: 300, library: 85, gallery: 20, projects: 330,
};

const BOOT_LINES = [
  "$ persona-os --boot",
  "> authenticating……… ok",
  "> loading entities……… ok",
  "> resolving relationships……… ok",
  "> seven systems online.",
];

/**
 * Pinned story hero. A tall section holds a sticky frame; scroll progress
 * through the section (0→1) drives three phases INSIDE the frame:
 *   phase 1 (0.0–0.4): terminal boots, lines appear
 *   phase 2 (0.4–0.8): the Atlas graph assembles from the centre
 *   phase 3 (0.8–1.0): the title + "systems online" settle in
 * The scene stays pinned while its internals advance — that's the scrub.
 *
 * Desktop: full scroll-scrub. Mobile / reduced-motion: the frame just shows the
 * final state (graph + title), no pin gymnastics — clean and intentional.
 */
export function StoryHero({ graph }: { graph: Graph }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [progress, setProgress] = useState(0);
  const [simple, setSimple] = useState(false); // mobile / reduced-motion
  const [dims] = useState({ w: 900, h: 520 });
  const nodesRef = useRef<SimNode[]>([]);
  const [, tick] = useState(0);

  // Lay the graph out ONCE (deterministic seed → sim to rest), store positions.
  useEffect(() => {
    const n = graph.nodes.length;
    const radius = Math.min(dims.w, dims.h) / 3;
    const nodes: SimNode[] = graph.nodes.map((node, i) => {
      const a = (i / Math.max(n, 1)) * Math.PI * 2;
      return { ...node, x: dims.w / 2 + Math.cos(a) * radius, y: dims.h / 2 + Math.sin(a) * radius };
    });
    const byId = new Map(nodes.map((nd) => [nd.id, nd]));
    const edges = graph.edges
      .map((e) => ({ source: byId.get(e.source)!, target: byId.get(e.target)! }))
      .filter((e) => e.source && e.target);
    const sim = forceSimulation(nodes)
      .force("charge", forceManyBody().strength(-260))
      .force("link", forceLink(edges).id((d) => (d as SimNode).id).distance(90).strength(0.5))
      .force("x", forceX(dims.w / 2).strength(0.06))
      .force("y", forceY(dims.h / 2).strength(0.08))
      .force("collide", forceCollide(30))
      .stop();
    for (let i = 0; i < 240; i++) sim.tick();
    for (const nd of nodes) {
      nd.x = Math.max(30, Math.min(dims.w - 30, nd.x));
      nd.y = Math.max(30, Math.min(dims.h - 30, nd.y));
    }
    nodesRef.current = nodes;
    tick((k) => k + 1);
  }, [graph, dims.w, dims.h]);

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 768px)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (mobile || reduce) { setSimple(true); setProgress(1); return; }

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = sectionRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const total = rect.height - window.innerHeight;
        const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
        setProgress(p);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);

  const p = progress;
  const bootShown = Math.min(BOOT_LINES.length, Math.ceil((p / 0.4) * BOOT_LINES.length));
  const graphIn = Math.max(0, Math.min(1, (p - 0.35) / 0.45)); // 0→1 across phase 2
  const titleIn = Math.max(0, Math.min(1, (p - 0.8) / 0.2));

  const edges = graph.edges;
  const byId = new Map(nodesRef.current.map((n) => [n.id, n]));

  return (
    <div ref={sectionRef} className="relative h-[300dvh]">
      <div className="sticky top-0 flex h-dvh flex-col items-center justify-center overflow-hidden">
        {/* the frame */}
        <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-(--color-hairline) bg-(--color-surface-sunken)/60 shadow-2xl"
          style={{ aspectRatio: "16 / 10" }}>
          {/* terminal boot (phase 1) */}
          <div className="absolute inset-0 flex flex-col justify-center p-8 font-(family-name:--font-mono) text-sm sm:p-12 sm:text-base"
            style={{ opacity: simple ? 0 : Math.max(0, 1 - graphIn * 1.5), transition: "opacity 0.2s linear" }}>
            {BOOT_LINES.slice(0, simple ? 0 : bootShown).map((line, i) => (
              <p key={i} className={i === BOOT_LINES.length - 1 ? "mt-2 text-(--color-accent)" : "text-(--color-ink-muted)"}>
                {line}
              </p>
            ))}
          </div>

          {/* the graph assembling (phase 2) */}
          <svg ref={svgRef} aria-hidden="true" viewBox={`0 0 ${dims.w} ${dims.h}`}
            className="absolute inset-0 h-full w-full"
            style={{ opacity: simple ? 1 : graphIn }}>
            <defs>
              <filter id="story-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            {edges.map((e, i) => {
              const s = byId.get(e.source), t = byId.get(e.target);
              if (!s || !t) return null;
              return <line key={i} x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                stroke="var(--color-accent)" strokeWidth={1.5}
                strokeOpacity={(simple ? 0.4 : graphIn * 0.4)} />;
            })}
            {nodesRef.current.map((n, i) => {
              // Nodes pop in staggered across phase 2.
              const nodeThreshold = i / Math.max(nodesRef.current.length, 1);
              const shown = simple || graphIn > nodeThreshold * 0.8;
              const r = 9 + Math.min(n.degree, 5) * 3;
              return (
                <circle key={n.id} cx={n.x} cy={n.y} r={shown ? r : 0}
                  fill={`oklch(70% 0.15 ${TYPE_HUE[n.type]})`} fillOpacity={0.9}
                  filter="url(#story-glow)"
                  style={{ transition: "r 0.4s var(--ease-quiet)" }} />
              );
            })}
          </svg>
        </div>

        {/* title + CTA (phase 3, over the frame) */}
        <div className="pointer-events-none absolute inset-x-0 bottom-[8%] flex flex-col items-center px-6 text-center"
          style={{ opacity: simple ? 1 : titleIn, transform: simple ? "none" : `translateY(${(1 - titleIn) * 20}px)`, transition: "opacity 0.3s linear" }}>
          <h1 className="font-(family-name:--font-display) text-[length:var(--text-title)] leading-[1.05] tracking-tight text-balance [text-shadow:0_2px_30px_var(--color-surface)]">
            A personal operating system.
          </h1>
          <Link href="/atlas" className="group pointer-events-auto mt-4 inline-flex items-center gap-1.5 text-sm text-(--color-accent)">
            Explore the map
            <ArrowUpRight className="size-4 transition-transform duration-200 ease-(--ease-quiet) group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        {/* scroll cue, fades as you progress */}
        <div className="absolute bottom-6 flex flex-col items-center gap-1 font-(family-name:--font-mono) text-xs tracking-widest text-(--color-ink-muted) uppercase"
          style={{ opacity: simple ? 0 : Math.max(0, 1 - p * 3) }}>
          Scroll
          <span className="h-6 w-px animate-pulse bg-(--color-ink-muted)" />
        </div>
      </div>
    </div>
  );
}
