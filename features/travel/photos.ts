import "server-only";
import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { entities, media } from "@/lib/db/schema";
import type { Block } from "@/features/entities/blocks";

/**
 * A single photo pinned at its own coordinates. Every photo carries its own
 * GPS (read at upload before Cloudinary stripped it), so one trip becomes many
 * precise pins — zoom into an area and each photo sits where it was taken.
 */
export interface TravelPhoto {
  url: string;
  alt: string;
  lat: number;
  lng: number;
  /** The trip this photo belongs to — click a pin, open the entry. */
  entrySlug: string;
  entryTitle: string;
  city: string | null;
  country: string | null;
}

/** Every geotagged photo across published travel entries. Published-only. */
export async function getTravelPhotos(): Promise<TravelPhoto[]> {
  const entries = await db
    .select({
      slug: entities.slug,
      title: entities.title,
      body: entities.body,
      coverMediaId: entities.coverMediaId,
      metadata: entities.metadata,
    })
    .from(entities)
    .where(and(eq(entities.type, "travel"), eq(entities.status, "published")));

  if (entries.length === 0) return [];

  // Only photos that actually have coordinates can be pinned.
  const geo = await db
    .select()
    .from(media)
    .where(and(isNotNull(media.lat), isNotNull(media.lng)));

  if (geo.length === 0) return [];

  const byId = new Map(geo.map((m) => [m.id, m]));
  // Body image blocks store a URL, not a media id — match on the URL, which is
  // Cloudinary's unique secure_url.
  const byUrl = new Map(geo.map((m) => [m.url, m]));

  const photos: TravelPhoto[] = [];
  const seen = new Set<string>();

  for (const entry of entries) {
    const meta = (entry.metadata ?? {}) as Record<string, unknown>;
    const city = typeof meta.city === "string" && meta.city ? meta.city : null;
    const country =
      typeof meta.country === "string" && meta.country ? meta.country : null;

    const candidates = [];
    if (entry.coverMediaId) {
      const cover = byId.get(entry.coverMediaId);
      if (cover) candidates.push(cover);
    }
    for (const block of (entry.body ?? []) as Block[]) {
      if (block.type === "image") {
        const m = byUrl.get(block.url);
        if (m) candidates.push(m);
      }
    }

    for (const m of candidates) {
      // A photo used twice shouldn't double-pin.
      const key = `${entry.slug}:${m.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      photos.push({
        url: m.url,
        alt: m.alt,
        lat: m.lat as number,
        lng: m.lng as number,
        entrySlug: entry.slug,
        entryTitle: entry.title,
        city,
        country,
      });
    }
  }

  return photos;
}
