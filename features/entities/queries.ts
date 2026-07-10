import { and, desc, eq, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { entities, media, type Entity, type EntityType, type Media } from "@/lib/db/schema";

const WORKBENCH_LIMIT = 5;

export async function getDrafts(limit = WORKBENCH_LIMIT): Promise<Entity[]> {
  return db
    .select()
    .from(entities)
    .where(eq(entities.status, "draft"))
    .orderBy(desc(entities.updatedAt))
    .limit(limit);
}

export async function getRecentlyEdited(
  limit = WORKBENCH_LIMIT,
): Promise<Entity[]> {
  return db
    .select()
    .from(entities)
    .where(ne(entities.status, "archived"))
    .orderBy(desc(entities.updatedAt))
    .limit(limit);
}

/** One grouped query rather than six counts. */
export async function getEntityCounts(): Promise<Partial<Record<EntityType, number>>> {
  const rows = await db
    .select({ type: entities.type, count: sql<number>`count(*)::int` })
    .from(entities)
    .groupBy(entities.type);

  return Object.fromEntries(rows.map((r) => [r.type, r.count]));
}

export async function listEntitiesByType(type: EntityType): Promise<Entity[]> {
  return db
    .select()
    .from(entities)
    .where(and(eq(entities.type, type), ne(entities.status, "archived")))
    .orderBy(desc(entities.updatedAt));
}

export async function getEntityBySlug(
  type: EntityType,
  slug: string,
): Promise<Entity | undefined> {
  const [row] = await db
    .select()
    .from(entities)
    .where(and(eq(entities.type, type), eq(entities.slug, slug)))
    .limit(1);
  return row;
}

export async function getMediaById(id: string): Promise<Media | undefined> {
  const [row] = await db.select().from(media).where(eq(media.id, id)).limit(1);
  return row;
}
