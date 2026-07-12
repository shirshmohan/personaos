import type { Graph, GraphEdge } from "./graph";

/**
 * Pure graph-shaping used by both queries. Extracted so it's testable without a
 * database: given published ids and all edges, keep only fully-published edges
 * and compute degree. This is the draft-safety guarantee, in one place.
 */
export function shapeEdges(
  publishedIds: Set<string>,
  raw: { fromEntityId: string; toEntityId: string; type: GraphEdge["type"] }[],
): { edges: GraphEdge[]; degree: Map<string, number> } {
  const edges = raw
    .filter((e) => publishedIds.has(e.fromEntityId) && publishedIds.has(e.toEntityId))
    .map((e) => ({ source: e.fromEntityId, target: e.toEntityId, type: e.type }));
  const degree = new Map<string, number>();
  for (const e of edges) {
    degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
    degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
  }
  return { edges, degree };
}
