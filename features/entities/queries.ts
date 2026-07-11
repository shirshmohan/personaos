import { and, desc, eq, ilike, ne, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  entities,
  media,
  relationships,
  type Entity,
  type EntityType,
  type Media,
} from "@/lib/db/schema";

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


/** Powers the relationship picker. Excludes archived and the entity itself. */
export async function searchEntities(
  query: string,
  excludeId?: string,
): Promise<Entity[]> {
  const q = query.trim();
  if (!q) return [];
  const conds = [
    ne(entities.status, "archived"),
    or(ilike(entities.title, `%${q}%`), ilike(entities.slug, `%${q}%`)),
  ];
  if (excludeId) conds.push(ne(entities.id, excludeId));
  return db.select().from(entities).where(and(...conds)).limit(8);
}

export async function getArchived(): Promise<Entity[]> {
  return db
    .select()
    .from(entities)
    .where(eq(entities.status, "archived"))
    .orderBy(desc(entities.updatedAt));
}

export async function getRelationshipsFor(entityId: string) {
  const rows = await db
    .select({ rel: relationships, entity: entities })
    .from(relationships)
    .innerJoin(
      entities,
      or(
        and(eq(relationships.fromEntityId, entityId), eq(entities.id, relationships.toEntityId)),
        and(eq(relationships.toEntityId, entityId), eq(entities.id, relationships.fromEntityId)),
      )!,
    )
    .where(
      or(eq(relationships.fromEntityId, entityId), eq(relationships.toEntityId, entityId)),
    );
  return rows.map((r) => ({ id: r.rel.id, type: r.rel.type, entity: r.entity }));
}
