import "server-only";
import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  entities,
  entityTags,
  media,
  relationships,
  tags,
  type EntityType,
} from "@/lib/db/schema";
import { bodySchema } from "./blocks";
import {
  toEntityDTO,
  toEntityRefDTO,
  type EntityDTO,
  type EntityRefDTO,
  type RelatedEntityDTO,
} from "./dto";

/**
 * PUBLISHED CONTENT ONLY. Every query in this file filters on
 * status = 'published'. Drafts and archived entities must never reach a public
 * surface — not the site, not the future JSON API. There is a test for this.
 *
 * The Studio reads from queries.ts, which sees everything. These two files are
 * kept apart on purpose: it should be impossible to leak a draft by importing
 * the wrong helper.
 */
const PUBLISHED = eq(entities.status, "published");

export async function listPublished(type: EntityType): Promise<EntityRefDTO[]> {
  const rows = await db
    .select({ entity: entities, cover: media })
    .from(entities)
    .leftJoin(media, eq(entities.coverMediaId, media.id))
    .where(and(eq(entities.type, type), PUBLISHED))
    .orderBy(desc(sql`coalesce(${entities.occurredAt}, ${entities.updatedAt})`));

  return rows.map((r) => toEntityRefDTO(r.entity, r.cover));
}

export async function getPublished(
  type: EntityType,
  slug: string,
): Promise<EntityDTO | null> {
  const [row] = await db
    .select({ entity: entities, cover: media })
    .from(entities)
    .leftJoin(media, eq(entities.coverMediaId, media.id))
    .where(and(eq(entities.type, type), eq(entities.slug, slug), PUBLISHED))
    .limit(1);

  if (!row) return null;

  const tagRows = await db
    .select({ tag: tags })
    .from(entityTags)
    .innerJoin(tags, eq(entityTags.tagId, tags.id))
    .where(eq(entityTags.entityId, row.entity.id));

  const parsed = bodySchema.safeParse(row.entity.body);

  return toEntityDTO(
    row.entity,
    row.cover,
    tagRows.map((t) => t.tag),
    parsed.success ? parsed.data : [],
  );
}

/**
 * Edges are stored once (A -> B) but the graph is undirected to a reader.
 * Walk both columns, exclude the entity itself, keep only published neighbours.
 */
export async function getRelated(entityId: string): Promise<RelatedEntityDTO[]> {
  const edges = await db
    .select()
    .from(relationships)
    .where(
      or(
        eq(relationships.fromEntityId, entityId),
        eq(relationships.toEntityId, entityId),
      ),
    );

  if (edges.length === 0) return [];

  const neighbourIds = edges.map((e) =>
    e.fromEntityId === entityId ? e.toEntityId : e.fromEntityId,
  );

  const rows = await db
    .select({ entity: entities, cover: media })
    .from(entities)
    .leftJoin(media, eq(entities.coverMediaId, media.id))
    .where(and(inArray(entities.id, neighbourIds), PUBLISHED));

  const typeById = new Map(
    edges.map((e) => [
      e.fromEntityId === entityId ? e.toEntityId : e.fromEntityId,
      e.type,
    ]),
  );

  return rows.map((r) => ({
    ...toEntityRefDTO(r.entity, r.cover),
    relationship: typeById.get(r.entity.id) ?? "related_to",
  }));
}

export async function listPublishedSlugs(
  type: EntityType,
): Promise<string[]> {
  const rows = await db
    .select({ slug: entities.slug })
    .from(entities)
    .where(and(eq(entities.type, type), PUBLISHED));
  return rows.map((r) => r.slug);
}

export async function getPublishedCountsByType(): Promise<
  Partial<Record<EntityType, number>>
> {
  const rows = await db
    .select({ type: entities.type, count: sql<number>`count(*)::int` })
    .from(entities)
    .where(PUBLISHED)
    .groupBy(entities.type);
  return Object.fromEntries(rows.map((r) => [r.type, r.count]));
}

export async function getMostRecentPublished(limit = 3): Promise<EntityRefDTO[]> {
  const rows = await db
    .select({ entity: entities, cover: media })
    .from(entities)
    .leftJoin(media, eq(entities.coverMediaId, media.id))
    .where(PUBLISHED)
    .orderBy(desc(sql`coalesce(${entities.occurredAt}, ${entities.updatedAt})`))
    .limit(limit);
  return rows.map((r) => toEntityRefDTO(r.entity, r.cover));
}
