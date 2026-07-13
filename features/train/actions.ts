"use server";

import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  entities, leetcodeProblems, problems, problemPatterns,
} from "@/lib/db/schema";
import { requireOwner } from "@/lib/auth/guard";
import { slugify } from "@/features/entities/slug";

export interface CatalogHit {
  slug: string; title: string; difficulty: string;
  frontendId: number | null; topicTags: string[]; paidOnly: boolean;
}

/** Search the public catalog (D51). Studio-only. */
export async function searchCatalog(query: string): Promise<CatalogHit[]> {
  await requireOwner();
  const q = query.trim();
  if (!q) return [];
  const rows = await db
    .select()
    .from(leetcodeProblems)
    .where(or(ilike(leetcodeProblems.title, `%${q}%`), ilike(leetcodeProblems.slug, `%${q}%`)))
    .orderBy(sql`case when ${leetcodeProblems.title} ilike ${q + "%"} then 0 else 1 end`, leetcodeProblems.frontendId)
    .limit(12);
  return rows.map((r) => ({
    slug: r.slug, title: r.title, difficulty: r.difficulty,
    frontendId: r.frontendId, topicTags: r.topicTags, paidOnly: r.paidOnly,
  }));
}

/**
 * Ensure a pattern ENTITY exists for a given name (D50). Patterns are Train
 * entities — created on demand, so a new pattern name becomes a real page.
 */
async function ensurePatternEntity(name: string): Promise<string> {
  const slug = slugify(name);
  const [existing] = await db
    .select({ id: entities.id })
    .from(entities)
    .where(and(eq(entities.type, "train"), eq(entities.slug, slug)))
    .limit(1);
  if (existing) return existing.id;
  const [created] = await db
    .insert(entities)
    .values({ type: "train", slug, title: name, status: "published" })
    .returning({ id: entities.id });
  return created.id;
}

export interface AddProblemInput {
  slug: string;           // catalog slug
  important?: boolean;
  myRating?: number | null;
  comment?: string | null;
  patterns: string[];     // pattern names (existing or new)
}

/** Add a solved problem, auto-filled from the catalog (D52). */
export async function addSolvedProblem(input: AddProblemInput) {
  await requireOwner();

  const [cat] = await db
    .select()
    .from(leetcodeProblems)
    .where(eq(leetcodeProblems.slug, input.slug))
    .limit(1);
  if (!cat) return { ok: false as const, error: "Not found in the catalog." };

  // Auto-fill everything from the catalog; user fields layered on top.
  const [row] = await db
    .insert(problems)
    .values({
      leetcodeSlug: cat.slug,
      title: cat.title,
      url: `https://leetcode.com/problems/${cat.slug}/`,
      difficulty: cat.difficulty,
      important: input.important ?? false,
      myRating: input.myRating ?? null,
      comment: input.comment ?? null,
    })
    .onConflictDoNothing({ target: problems.leetcodeSlug })
    .returning({ id: problems.id });

  if (!row) return { ok: false as const, error: "You've already added this problem." };

  // Attach patterns — each is a Train entity, created if new (D53).
  for (const name of input.patterns) {
    const patternId = await ensurePatternEntity(name);
    await db.insert(problemPatterns)
      .values({ problemId: row.id, patternEntityId: patternId })
      .onConflictDoNothing();
  }
  return { ok: true as const, id: row.id };
}

export async function toggleImportant(id: string, important: boolean) {
  await requireOwner();
  await db.update(problems).set({ important }).where(eq(problems.id, id));
}

export async function removeProblem(id: string) {
  await requireOwner();
  await db.delete(problems).where(eq(problems.id, id));
}

export async function listMyProblems() {
  await requireOwner();
  const rows = await db.select().from(problems).orderBy(desc(problems.solvedAt));
  const links = await db
    .select({ problemId: problemPatterns.problemId, name: entities.title })
    .from(problemPatterns)
    .innerJoin(entities, eq(entities.id, problemPatterns.patternEntityId));
  const byProblem = new Map<string, string[]>();
  for (const l of links) {
    const arr = byProblem.get(l.problemId) ?? [];
    arr.push(l.name);
    byProblem.set(l.problemId, arr);
  }
  return rows.map((r) => ({ ...r, patterns: byProblem.get(r.id) ?? [] }));
}

export async function catalogCount(): Promise<number> {
  const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(leetcodeProblems);
  return row?.n ?? 0;
}
