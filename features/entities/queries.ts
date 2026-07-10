import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { entities, type Entity, type EntityType } from "@/lib/db/schema";

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
    .where(eq(entities.type, type))
    .orderBy(desc(entities.updatedAt));
}
