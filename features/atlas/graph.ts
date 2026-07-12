import "server-only";
import { and, eq, inArray, or } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  entities,
  relationships,
  type EntityType,
  type RelationshipType,
} from "@/lib/db/schema";
import { shapeEdges } from "./shape";

export interface GraphNode {
  id: string;
  type: EntityType;
  slug: string;
  title: string;
  degree: number;
}
export interface GraphEdge {
  source: string;
  target: string;
  type: RelationshipType;
}
export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export async function getFullGraph(): Promise<Graph> {
  const pubEntities = await db
    .select({ id: entities.id, type: entities.type, slug: entities.slug, title: entities.title })
    .from(entities)
    .where(eq(entities.status, "published"));
  const publishedIds = new Set(pubEntities.map((e) => e.id));
  const allEdges = await db.select().from(relationships);
  const edges: GraphEdge[] = allEdges
    .filter((e) => publishedIds.has(e.fromEntityId) && publishedIds.has(e.toEntityId))
    .map((e) => ({ source: e.fromEntityId, target: e.toEntityId, type: e.type }));
  const degree = new Map<string, number>();
  for (const e of edges) {
    degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
    degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
  }
  const nodes: GraphNode[] = pubEntities.map((e) => ({ ...e, degree: degree.get(e.id) ?? 0 }));
  return { nodes, edges };
}

export async function getLocalGraph(type: EntityType, slug: string): Promise<Graph> {
  const [center] = await db
    .select({ id: entities.id, type: entities.type, slug: entities.slug, title: entities.title })
    .from(entities)
    .where(and(eq(entities.type, type), eq(entities.slug, slug), eq(entities.status, "published")))
    .limit(1);
  if (!center) return { nodes: [], edges: [] };
  const edgeRows = await db
    .select()
    .from(relationships)
    .where(or(eq(relationships.fromEntityId, center.id), eq(relationships.toEntityId, center.id)));
  const neighbourIds = edgeRows.map((e) => (e.fromEntityId === center.id ? e.toEntityId : e.fromEntityId));
  const neighbours = neighbourIds.length
    ? await db
        .select({ id: entities.id, type: entities.type, slug: entities.slug, title: entities.title })
        .from(entities)
        .where(and(inArray(entities.id, neighbourIds), eq(entities.status, "published")))
    : [];
  const pubIds = new Set([center.id, ...neighbours.map((n) => n.id)]);
  const edges: GraphEdge[] = edgeRows
    .filter((e) => pubIds.has(e.fromEntityId) && pubIds.has(e.toEntityId))
    .map((e) => ({ source: e.fromEntityId, target: e.toEntityId, type: e.type }));
  const nodes: GraphNode[] = [center, ...neighbours].map((n) => ({
    ...n,
    degree: edges.filter((e) => e.source === n.id || e.target === n.id).length,
  }));
  return { nodes, edges };
}
