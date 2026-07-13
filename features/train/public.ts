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
  important: boolean; myRating: number | null; comment: string | null;
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
  }));
}
