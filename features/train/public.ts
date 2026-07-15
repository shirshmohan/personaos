import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { entities, problems, problemPatterns } from "@/lib/db/schema";

export interface PatternSummary {
  slug: string; title: string; count: number;
}

/** Published Train patterns with how many problems each holds. */
export async function listPatterns(): Promise<PatternSummary[]> {
  const rows = await db
    .select({ id: entities.id, slug: entities.slug, title: entities.title })
    .from(entities)
    .where(and(eq(entities.type, "train"), eq(entities.status, "published")));

  const links = await db
    .select({ patternId: problemPatterns.patternEntityId })
    .from(problemPatterns);
  const counts = new Map<string, number>();
  for (const l of links) counts.set(l.patternId, (counts.get(l.patternId) ?? 0) + 1);

  return rows
    .map((r) => ({ slug: r.slug, title: r.title, count: counts.get(r.id) ?? 0 }))
    .sort((a, b) => b.count - a.count);
}

export interface PatternProblem {
  title: string; url: string; difficulty: string;
  important: boolean; myRating: number | null; comment: string | null; companies: string[];
}

/** The problems filed under a pattern, by its slug. */
export async function getPatternProblems(slug: string): Promise<PatternProblem[]> {
  const [pattern] = await db
    .select({ id: entities.id })
    .from(entities)
    .where(and(eq(entities.type, "train"), eq(entities.slug, slug), eq(entities.status, "published")))
    .limit(1);
  if (!pattern) return [];

  const rows = await db
    .select({ p: problems })
    .from(problemPatterns)
    .innerJoin(problems, eq(problems.id, problemPatterns.problemId))
    .where(eq(problemPatterns.patternEntityId, pattern.id))
    .orderBy(desc(problems.important), desc(problems.solvedAt));

  return rows.map((r) => ({
    title: r.p.title, url: r.p.url, difficulty: r.p.difficulty,
    important: r.p.important, myRating: r.p.myRating, comment: r.p.comment,
    companies: r.p.companies ?? [],
  }));
}

import { relationships } from "@/lib/db/schema";
import type { Graph } from "@/features/atlas/graph";

/**
 * The Train roadmap graph: each PATTERN is a hub, each PROBLEM you solved under
 * it is a child node. Problems radiate from their pattern(s). Pattern↔pattern
 * relationships also drawn as edges between hubs. This is the NeetCode-style
 * map — the problems ARE the graph.
 */
export type TrainNodeKind = "pattern" | "problem";
export interface TrainNode {
  id: string; kind: TrainNodeKind; label: string;
  href: string | null;        // pattern -> /train/slug ; problem -> leetcode url
  difficulty: string | null;  // problems only
  important: boolean;         // problems only
  size: number;               // pattern: problem count ; problem: 1
}
export interface TrainEdge { source: string; target: string; }
export interface TrainGraph { nodes: TrainNode[]; edges: TrainEdge[]; }

export async function getTrainGraph(): Promise<TrainGraph> {
  const pats = await db
    .select({ id: entities.id, slug: entities.slug, title: entities.title })
    .from(entities)
    .where(and(eq(entities.type, "train"), eq(entities.status, "published")));

  const links = await db
    .select({ patternId: problemPatterns.patternEntityId, p: problems })
    .from(problemPatterns)
    .innerJoin(problems, eq(problems.id, problemPatterns.problemId));

  const count = new Map<string, number>();
  for (const l of links) count.set(l.patternId, (count.get(l.patternId) ?? 0) + 1);

  const nodes: TrainNode[] = [];
  const edges: TrainEdge[] = [];

  // pattern hubs
  for (const p of pats) {
    nodes.push({
      id: `pat:${p.id}`, kind: "pattern", label: p.title,
      href: `/train/${p.slug}`, difficulty: null, important: false,
      size: count.get(p.id) ?? 0,
    });
  }
  // problem children (deduped — a problem can sit under several patterns)
  const seen = new Set<string>();
  for (const l of links) {
    const pid = `prob:${l.p.id}`;
    if (!seen.has(pid)) {
      seen.add(pid);
      nodes.push({
        id: pid, kind: "problem", label: l.p.title, href: l.p.url,
        difficulty: l.p.difficulty, important: l.p.important, size: 1,
      });
    }
    edges.push({ source: `pat:${l.patternId}`, target: pid });
  }
  // pattern <-> pattern relationships
  const patIds = new Set(pats.map((p) => p.id));
  const rels = await db.select().from(relationships);
  for (const r of rels) {
    if (patIds.has(r.fromEntityId) && patIds.has(r.toEntityId)) {
      edges.push({ source: `pat:${r.fromEntityId}`, target: `pat:${r.toEntityId}` });
    }
  }
  return { nodes, edges };
}
