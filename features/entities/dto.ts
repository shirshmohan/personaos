import type { Block } from "./blocks";
import type { Entity, EntityType, Media, RelationshipType, Tag } from "@/lib/db/schema";

/**
 * The public shape of an entity. This is the contract a future JSON API and a
 * future mobile app will consume (D23), so it is defined once, here, rather
 * than being whatever a page component happened to select.
 *
 * Two rules:
 *   1. No internal columns leak (no `status`, no `coverMediaId`, no timestamps
 *      the reader has no use for).
 *   2. Dates are ISO strings, not Date objects — JSON has no Date.
 */
export interface MediaDTO {
  url: string;
  alt: string;
  width: number;
  height: number;
}

export interface EntityRefDTO {
  type: EntityType;
  slug: string;
  title: string;
  summary: string | null;
  cover: MediaDTO | null;
}

export interface RelatedEntityDTO extends EntityRefDTO {
  relationship: RelationshipType;
}

export interface EntityDTO extends EntityRefDTO {
  body: Block[];
  occurredAt: string | null;
  updatedAt: string;
  tags: string[];
  metadata: Record<string, unknown>;
}

export function toMediaDTO(m: Media | null | undefined): MediaDTO | null {
  if (!m) return null;
  return { url: m.url, alt: m.alt, width: m.width, height: m.height };
}

export function toEntityRefDTO(
  e: Entity,
  cover?: Media | null,
): EntityRefDTO {
  return {
    type: e.type,
    slug: e.slug,
    title: e.title,
    summary: e.summary,
    cover: toMediaDTO(cover),
  };
}

export function toEntityDTO(
  e: Entity,
  cover: Media | null | undefined,
  tagList: Tag[] = [],
  body: Block[] = [],
): EntityDTO {
  return {
    ...toEntityRefDTO(e, cover),
    body,
    occurredAt: e.occurredAt ? e.occurredAt.toISOString() : null,
    updatedAt: e.updatedAt.toISOString(),
    tags: tagList.map((t) => t.name),
    metadata: (e.metadata ?? {}) as Record<string, unknown>,
  };
}
