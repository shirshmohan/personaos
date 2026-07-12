"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import { ENTITY_TYPE_META } from "@/features/entities/types";
import type { EntityType } from "@/lib/db/schema";

interface SimNode extends GraphNode {
  x: number;
  y: number;
}
interface SimEdge {
  source: SimNode;
  target: SimNode;
  type: string;
}

// Node colour by type — reuses the accent, tinted per type via hue.
const TYPE_HUE: Record<EntityType, number> = {
  career: 250, writing: 200, travel: 150, train: 300,
  library: 85, gallery: 20, projects: 330,
};
function nodeColor(type: EntityType) {
  return `oklch(68% 0.13 ${TYPE_HUE[type]})`;
}

export function AtlasGraph({ graph, height = 560 }: { graph: Graph; height?: number }) {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement>(null);
  const [dims, setDims] = useState({ w: 900, h: height });
  const [, force] = useState(0); // re-render tick
  const [hover, setHover] = useState<string | null>(null);
  const simRef = useRef<Simulation<SimNode, undefined> | null>(null);

  // Build sim nodes/edges once per graph. Positions are seeded DETERMINISTICALLY
  // (on a circle) — never Math.random — so the server and client first paint
  // agree and React doesn't throw a hydration mismatch. The simulation takes
  // over from this stable, centered starting ring.
  const { nodes, edges } = useMemo(() => {
    const n = graph.nodes.length;
    const radius = Math.min(dims.w, dims.h) / 3.2;
    const nodes: SimNode[] = graph.nodes.map((node, i) => {
      const angle = (i / Math.max(n, 1)) * Math.PI * 2;
      return {
        ...node,
        x: dims.w / 2 + Math.cos(angle) * radius,
        y: dims.h / 2 + Math.sin(angle) * radius,
      };
    });
    const byId = new Map(nodes.map((nd) => [nd.id, nd]));
    const edges: SimEdge[] = graph.edges
      .map((e) => ({ source: byId.get(e.source)!, target: byId.get(e.target)!, type: e.type }))
      .filter((e) => e.source && e.target);
    return { nodes, edges };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph, dims.w, dims.h]);

  useEffect(() => {
    const el = svgRef.current?.parentElement;
    if (el) setDims((d) => ({ ...d, w: el.clientWidth }));
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pad = 40; // keep nodes this far from the edge
    const clamp = () => {
      for (const n of nodes) {
        n.x = Math.max(pad, Math.min(dims.w - pad, n.x));
        n.y = Math.max(pad, Math.min(dims.h - pad, n.y));
      }
    };
    const sim = forceSimulation(nodes)
      .force("charge", forceManyBody().strength(-240))
      .force("link", forceLink(edges).id((d) => (d as SimNode).id).distance(90).strength(0.5))
      // Pull everything toward the middle — forceX/Y are gentler and more stable
      // than forceCenter alone, and they gather disconnected nodes instead of
      // letting them drift into the corners.
      .force("x", forceX(dims.w / 2).strength(0.06))
      .force("y", forceY(dims.h / 2).strength(0.08))
      .force("collide", forceCollide(30))
      .on("tick", () => {
        clamp(); // hard boundary — a node can never leave the box
        force((n) => n + 1);
      });
    simRef.current = sim;
    if (reduce) {
      sim.stop();
      for (let i = 0; i < 240; i++) sim.tick();
      clamp();
      force((n) => n + 1);
    }
    return () => {
      sim.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, dims.w, dims.h]);

  // drag
  const drag = useRef<{ id: string } | null>(null);
  function onPointerDown(id: string, e: React.PointerEvent) {
    drag.current = { id };
    (e.target as Element).setPointerCapture(e.pointerId);
    simRef.current?.alphaTarget(0.3).restart();
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current || !svgRef.current) return;
    const pt = svgRef.current.getBoundingClientRect();
    const n = nodes.find((x) => x.id === drag.current!.id);
    if (n) {
      n.x = Math.max(40, Math.min(dims.w - 40, e.clientX - pt.left));
      n.y = Math.max(40, Math.min(dims.h - 40, e.clientY - pt.top));
      force((k) => k + 1);
    }
  }
  function onPointerUp() {
    drag.current = null;
    simRef.current?.alphaTarget(0);
  }

  const connected = useMemo(() => {
    if (!hover) return new Set<string>();
    const s = new Set<string>([hover]);
    for (const e of edges) {
      if (e.source.id === hover) s.add(e.target.id);
      if (e.target.id === hover) s.add(e.source.id);
    }
    return s;
  }, [hover, edges]);

  if (graph.nodes.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-(--color-border) px-6 py-10 text-sm text-(--color-ink-muted)">
        Nothing connected yet. Relationships between entities appear here as a map.
      </p>
    );
  }

  return (
    <svg
      ref={svgRef}
      role="img"
      aria-label="A graph of connected entities"
      width="100%"
      height={dims.h}
      viewBox={`0 0 ${dims.w} ${dims.h}`}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className="touch-none select-none"
    >
      {edges.map((e, i) => {
        const active = !hover || connected.has(e.source.id) && connected.has(e.target.id);
        return (
          <line
            key={i}
            x1={e.source.x} y1={e.source.y} x2={e.target.x} y2={e.target.y}
            stroke="var(--color-ink-muted)"
            strokeWidth={1}
            strokeOpacity={active ? 0.35 : 0.08}
          />
        );
      })}
      {nodes.map((n) => {
        const r = 8 + Math.min(n.degree, 6) * 2.5;
        const active = !hover || connected.has(n.id);
        return (
          <g
            key={n.id}
            transform={`translate(${n.x},${n.y})`}
            style={{ cursor: "pointer", opacity: active ? 1 : 0.25, transition: "opacity 0.2s" }}
            onPointerDown={(e) => onPointerDown(n.id, e)}
            onMouseEnter={() => setHover(n.id)}
            onMouseLeave={() => setHover(null)}
            onClick={() => router.push(`/${n.type}/${n.slug}`)}
          >
            <circle r={r} fill={nodeColor(n.type)} stroke="var(--color-surface)" strokeWidth={2} />
            <text
              y={r + 14}
              textAnchor="middle"
              fontSize={12}
              fill="var(--color-ink)"
              style={{ pointerEvents: "none" }}
            >
              {n.title.length > 22 ? n.title.slice(0, 21) + "…" : n.title}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
