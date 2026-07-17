"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY, type Simulation,
} from "d3-force";
import type { TrainGraph, TrainNode } from "@/features/train/public";
import { setGraphFocus, getGraphFocus } from "@/features/train/graph-focus";

interface SimNode extends TrainNode { x: number; y: number; }
interface SimEdge { source: SimNode; target: SimNode; }

const DIFF_COLOR: Record<string, string> = {
  Easy: "oklch(70% 0.15 150)", Medium: "oklch(76% 0.14 85)", Hard: "oklch(64% 0.19 25)",
};

export function TrainGraphView({ graph, height = 520 }: { graph: TrainGraph; height?: number }) {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement>(null);
  const [dims, setDims] = useState({ w: 1000, h: height });
  const [mounted, setMounted] = useState(false);
  const [, tick] = useState(0);
  const [hover, setHover] = useState<string | null>(null);
  const simRef = useRef<Simulation<SimNode, undefined> | null>(null);

  const { nodes, edges } = useMemo(() => {
    const n = graph.nodes.length;
    const r = Math.min(dims.w, dims.h) / 3;
    const nodes: SimNode[] = graph.nodes.map((nd, i) => {
      const a = (i / Math.max(n, 1)) * Math.PI * 2;
      return { ...nd, x: dims.w / 2 + Math.cos(a) * r, y: dims.h / 2 + Math.sin(a) * r };
    });
    const byId = new Map(nodes.map((nd) => [nd.id, nd]));
    const edges: SimEdge[] = graph.edges
      .map((e) => ({ source: byId.get(e.source)!, target: byId.get(e.target)! }))
      .filter((e) => e.source && e.target);
    return { nodes, edges };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph, dims.w, dims.h]);

  useEffect(() => {
    const el = svgRef.current?.parentElement;
    if (el) setDims((d) => ({ ...d, w: el.clientWidth }));
    setMounted(true);
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pad = 44;
    const clamp = () => { for (const n of nodes) { n.x = Math.max(pad, Math.min(dims.w - pad, n.x)); n.y = Math.max(pad, Math.min(dims.h - pad, n.y)); } };
    const sim = forceSimulation(nodes)
      // patterns repel hard so clusters separate; problems sit close to their hub
      .force("charge", forceManyBody().strength((d) => ((d as SimNode).kind === "pattern" ? -600 : -80)))
      .force("link", forceLink(edges).id((d) => (d as SimNode).id).distance(60).strength(0.7))
      .force("x", forceX(dims.w / 2).strength(0.05))
      .force("y", forceY(dims.h / 2).strength(0.07))
      .force("collide", forceCollide((d) => ((d as SimNode).kind === "pattern" ? 34 : 14)))
      .on("tick", () => { clamp(); tick((n) => n + 1); });
    simRef.current = sim;
    if (reduce) { sim.stop(); for (let i = 0; i < 260; i++) sim.tick(); clamp(); tick((n) => n + 1); }
    return () => { sim.stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, dims.w, dims.h]);

  // drag
  const drag = useRef<string | null>(null);
  function down(id: string, e: React.PointerEvent) { drag.current = id; (e.target as Element).setPointerCapture(e.pointerId); simRef.current?.alphaTarget(0.3).restart(); }
  function move(e: React.PointerEvent) {
    if (!drag.current || !svgRef.current) return;
    const r = svgRef.current.getBoundingClientRect();
    const n = nodes.find((x) => x.id === drag.current);
    if (n) { n.x = Math.max(44, Math.min(dims.w - 44, e.clientX - r.left)); n.y = Math.max(44, Math.min(dims.h - 44, e.clientY - r.top)); tick((k) => k + 1); }
  }
  function up() { drag.current = null; simRef.current?.alphaTarget(0); }

  const connected = useMemo(() => {
    if (!hover) return new Set<string>();
    const s = new Set([hover]);
    for (const e of edges) { if (e.source.id === hover) s.add(e.target.id); if (e.target.id === hover) s.add(e.source.id); }
    return s;
  }, [hover, edges]);

  if (graph.nodes.length === 0) {
    return <p className="rounded-lg border border-dashed border-(--color-border) px-6 py-10 text-sm text-(--color-ink-muted)">No problems yet — add some in the Studio and they'll appear here under their patterns.</p>;
  }

  return (
    <svg ref={svgRef} role="img" aria-label="Patterns and the problems solved under them"
      width="100%" height={dims.h} viewBox={`0 0 ${dims.w} ${dims.h}`}
      onPointerMove={move} onPointerUp={up} className="touch-none select-none">
      {!mounted ? null : (
        <>
      {edges.map((e, i) => {
        const active = !hover || (connected.has(e.source.id) && connected.has(e.target.id));
        return <line key={i} x1={e.source.x} y1={e.source.y} x2={e.target.x} y2={e.target.y}
          stroke="var(--color-ink-muted)" strokeWidth={1} strokeOpacity={active ? 0.3 : 0.06} />;
      })}
      {nodes.map((n) => {
        const isPat = n.kind === "pattern";
        const r = isPat ? 12 + Math.min(n.size, 8) * 2 : 6;
        const active = !hover || connected.has(n.id);
        const color = isPat ? "var(--color-accent)" : (n.difficulty ? DIFF_COLOR[n.difficulty] : "var(--color-ink-muted)");
        return (
          <g key={n.id} transform={`translate(${n.x},${n.y})`}
            style={{ cursor: "pointer", opacity: active ? 1 : 0.2, transition: "opacity 0.2s" }}
            onPointerDown={(e) => down(n.id, e)}
            onMouseEnter={(e) => {
              setHover(n.id);
              // Viewport coords: the only frame the backdrop and the SVG agree on.
              setGraphFocus({ x: e.clientX, y: e.clientY, active: true });
            }}
            onMouseLeave={() => {
              setHover(null);
              setGraphFocus({ ...getGraphFocus(), active: false });
            }}
            onClick={() => { if (!n.href) return; isPat ? router.push(n.href) : window.open(n.href, "_blank"); }}>
            {n.important ? <circle r={r + 3} fill="none" stroke="oklch(76% 0.14 85)" strokeWidth={1.5} /> : null}
            <circle r={r} fill={color} stroke="var(--color-surface)" strokeWidth={2} />
            {isPat ? (
              <text y={r + 15} textAnchor="middle" fontSize={13} fontWeight={500} fill="var(--color-ink)" style={{ pointerEvents: "none" }}>
                {n.label}
              </text>
            ) : (
              hover === n.id ? (
                <text y={-r - 8} textAnchor="middle" fontSize={11} fill="var(--color-ink)" style={{ pointerEvents: "none" }}>
                  {n.label.length > 30 ? n.label.slice(0, 29) + "…" : n.label}
                </text>
              ) : null
            )}
          </g>
        );
      })}
        </>
      )}
    </svg>
  );
}
