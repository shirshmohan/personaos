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

/** Convenience for pages: resolve slug -> id -> related, published-only. */
export async function getRelatedBySlug(
  type: EntityType,
  slug: string,
): Promise<RelatedEntityDTO[]> {
  const [row] = await db
    .select({ id: entities.id })
    .from(entities)
    .where(and(eq(entities.type, type), eq(entities.slug, slug), PUBLISHED))
    .limit(1);
  if (!row) return [];
  return getRelated(row.id);
}

export interface LibraryItem extends EntityRefDTO {
  tier: string | null;
  category: string | null;
  genres: string[];
}

export async function listLibrary(): Promise<LibraryItem[]> {
  const rows = await db
    .select({ entity: entities, cover: media })
    .from(entities)
    .leftJoin(media, eq(entities.coverMediaId, media.id))
    .where(and(eq(entities.type, "library"), PUBLISHED))
    .orderBy(desc(sql`coalesce(${entities.occurredAt}, ${entities.updatedAt})`));

  return rows.map((r) => {
    const meta = (r.entity.metadata ?? {}) as Record<string, unknown>;
    return {
      ...toEntityRefDTO(r.entity, r.cover),
      tier: typeof meta.tier === "string" ? meta.tier : null,
      category: typeof meta.category === "string" ? meta.category : null,
      genres: Array.isArray(meta.genre) ? (meta.genre as string[]) : [],
    };
  });
}

export async function getPublishedIdBySlug(
  type: EntityType,
  slug: string,
): Promise<string | null> {
  const [row] = await db
    .select({ id: entities.id })
    .from(entities)
    .where(and(eq(entities.type, type), eq(entities.slug, slug), PUBLISHED))
    .limit(1);
  return row?.id ?? null;
}

export interface CareerRole extends EntityRefDTO {
  employer: string | null;
  role: string | null;
  location: string | null;
  startDate: string | null;  // from occurred_at
  endDate: string | null;    // from metadata.endDate
}

export async function listCareer(): Promise<CareerRole[]> {
  const rows = await db
    .select({ entity: entities, cover: media })
    .from(entities)
    .leftJoin(media, eq(entities.coverMediaId, media.id))
    .where(and(eq(entities.type, "career"), PUBLISHED))
    // Newest-first: prefer end date, then start, then edit time. endDate is
    // free-text metadata — '' crashes ::date — so only cast well-formed dates.
    .orderBy(
      desc(
        sql`coalesce(
          case
            when (${entities.metadata}->>'endDate') ~ '^\d{4}-\d{2}-\d{2}$'
            then (${entities.metadata}->>'endDate')::date
          end,
          ${entities.occurredAt},
          ${entities.updatedAt}
        )`,
      ),
    );

  return rows.map((r) => {
    const m = (r.entity.metadata ?? {}) as Record<string, unknown>;
    return {
      ...toEntityRefDTO(r.entity, r.cover),
      employer: typeof m.employer === "string" ? m.employer : null,
      role: typeof m.role === "string" ? m.role : null,
      location: typeof m.location === "string" ? m.location : null,
      startDate: r.entity.occurredAt ? r.entity.occurredAt.toISOString() : null,
      endDate: typeof m.endDate === "string" && m.endDate ? m.endDate : null,
    };
  });
}

export async function getPreview(
  type: EntityType,
  limit = 4,
): Promise<EntityRefDTO[]> {
  const rows = await db
    .select({ entity: entities, cover: media })
    .from(entities)
    .leftJoin(media, eq(entities.coverMediaId, media.id))
    .where(and(eq(entities.type, type), PUBLISHED))
    .orderBy(desc(sql`coalesce(${entities.occurredAt}, ${entities.updatedAt})`))
    .limit(limit);
  return rows.map((r) => toEntityRefDTO(r.entity, r.cover));
}

export interface RichPreview extends EntityRefDTO {
  meta: Record<string, unknown>;
  genres: string[];
}

export async function getRichPreview(type: EntityType): Promise<RichPreview | null> {
  const [row] = await db
    .select({ entity: entities, cover: media })
    .from(entities)
    .leftJoin(media, eq(entities.coverMediaId, media.id))
    .where(and(eq(entities.type, type), PUBLISHED))
    .orderBy(desc(sql`coalesce(${entities.occurredAt}, ${entities.updatedAt})`))
    .limit(1);
  if (!row) return null;
  const m = (row.entity.metadata ?? {}) as Record<string, unknown>;
  return {
    ...toEntityRefDTO(row.entity, row.cover),
    meta: m,
    genres: Array.isArray(m.genre) ? (m.genre as string[]) : [],
  };
}
