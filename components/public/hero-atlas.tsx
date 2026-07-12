"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type Simulation,
} from "d3-force";
import type { Graph, GraphNode } from "@/features/atlas/graph";
import type { EntityType } from "@/lib/db/schema";

interface SimNode extends GraphNode { x: number; y: number; }

const TYPE_HUE: Record<EntityType, number> = {
  career: 250, writing: 200, travel: 150, train: 300, library: 85, gallery: 20, projects: 330,
};

/**
 * Ambient hero graph. Unlike /atlas this is a BACKDROP: it drifts slowly, isn't
 * interactive, and sits behind the title at low contrast. A living texture, not
 * a toy. prefers-reduced-motion → a single static frame (no perpetual motion).
 */
export function HeroAtlas({ graph }: { graph: Graph }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dims, setDims] = useState({ w: 1200, h: 700 });
  const [, tick] = useState(0);
  const simRef = useRef<Simulation<SimNode, undefined> | null>(null);

  const { nodes, edges } = useMemo(() => {
    const n = graph.nodes.length;
    const radius = Math.min(dims.w, dims.h) / 2.6;
    const nodes: SimNode[] = graph.nodes.map((node, i) => {
      const a = (i / Math.max(n, 1)) * Math.PI * 2;
      return { ...node, x: dims.w / 2 + Math.cos(a) * radius, y: dims.h / 2 + Math.sin(a) * radius };
    });
    const byId = new Map(nodes.map((nd) => [nd.id, nd]));
    const edges = graph.edges
      .map((e) => ({ source: byId.get(e.source)!, target: byId.get(e.target)! }))
      .filter((e) => e.source && e.target);
    return { nodes, edges };
  }, [graph, dims.w, dims.h]);

  useEffect(() => {
    const el = svgRef.current?.parentElement;
    if (el) setDims({ w: el.clientWidth, h: el.clientHeight });
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pad = 30;
    const clamp = () => {
      for (const n of nodes) {
        n.x = Math.max(pad, Math.min(dims.w - pad, n.x));
        n.y = Math.max(pad, Math.min(dims.h - pad, n.y));
      }
    };
    const sim = forceSimulation(nodes)
      .force("charge", forceManyBody().strength(-200))
      .force("link", forceLink(edges).id((d) => (d as SimNode).id).distance(120).strength(0.4))
      .force("x", forceX(dims.w / 2).strength(0.04))
      .force("y", forceY(dims.h / 2).strength(0.05))
      .force("collide", forceCollide(26))
      .on("tick", () => { clamp(); tick((n) => n + 1); });
    simRef.current = sim;

    if (reduce) {
      sim.stop();
      for (let i = 0; i < 200; i++) sim.tick();
      clamp();
      tick((n) => n + 1);
    } else {
      // Keep a whisper of motion forever — the graph breathes rather than freezes.
      sim.alphaMin(0).alphaDecay(0.012).velocityDecay(0.55);
      const drift = setInterval(() => sim.alpha(0.12).restart(), 4000);
      return () => { clearInterval(drift); sim.stop(); };
    }
    return () => { sim.stop(); };
  }, [nodes, edges, dims.w, dims.h]);

  if (graph.nodes.length === 0) return null;

  return (
    <svg
      ref={svgRef}
      aria-hidden="true"
      width="100%" height="100%"
      viewBox={`0 0 ${dims.w} ${dims.h}`}
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <defs>
        <filter id="hero-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {edges.map((e, i) => (
        <line key={i} x1={e.source.x} y1={e.source.y} x2={e.target.x} y2={e.target.y}
          stroke="var(--color-accent)" strokeWidth={1.5} strokeOpacity={0.4} />
      ))}
      {nodes.map((n) => {
        const r = 9 + Math.min(n.degree, 5) * 3;
        return (
          <g key={n.id}>
            <circle cx={n.x} cy={n.y} r={r + 6}
              fill={`oklch(68% 0.14 ${TYPE_HUE[n.type]})`} fillOpacity={0.12} />
            <circle cx={n.x} cy={n.y} r={r}
              fill={`oklch(70% 0.15 ${TYPE_HUE[n.type]})`} fillOpacity={0.9}
              filter="url(#hero-glow)" />
          </g>
        );
      })}
    </svg>
  );
}
