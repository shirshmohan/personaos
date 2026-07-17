"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { entities, media } from "@/lib/db/schema";
import { isValidCoords } from "@/features/entities/coords";
import { requireOwner } from "@/lib/auth/guard";
import { entityInputSchema, METADATA_SCHEMAS, type EntityInput } from "./schemas";
import { pruneBlocks } from "./blocks";
import { syncEntityTags } from "./tags";
import { describeIssue } from "./errors";
import { genreToTag } from "./genres";
import { techToTag } from "./tech";

export type ActionResult =
  | { ok: true; slug: string }
  | { ok: false; error: string };

async function slugTaken(slug: string, excludeId?: string) {
  const rows = await db
    .select({ id: entities.id })
    .from(entities)
    .where(
      excludeId
        ? and(eq(entities.slug, slug), ne(entities.id, excludeId))
        : eq(entities.slug, slug),
    )
    .limit(1);
  return rows.length > 0;
}

export async function saveEntity(input: EntityInput): Promise<ActionResult> {
  await requireOwner();

  const parsed = entityInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: describeIssue(parsed.error.issues[0]) };
  }
  const data = parsed.data;

  const meta = METADATA_SCHEMAS[data.type].safeParse(data.metadata);
  if (!meta.success) {
    return { ok: false, error: describeIssue(meta.error.issues[0]) };
  }

  // The DB index would reject this anyway; catching it here lets us say
  // something kinder than "duplicate key violates unique constraint".
  if (await slugTaken(data.slug, data.id)) {
    return { ok: false, error: `The slug "${data.slug}" is already in use.` };
  }

  const values = {
    type: data.type,
    slug: data.slug,
    title: data.title,
    summary: data.summary || null,
    status: data.status,
    body: pruneBlocks(data.body),
    coverMediaId: data.coverMediaId ?? null,
    occurredAt: data.occurredAt ? new Date(data.occurredAt) : null,
    metadata: meta.data as Record<string, unknown>,
  };

  let entityId = data.id;
  if (entityId) {
    await db.update(entities).set(values).where(eq(entities.id, entityId));
  } else {
    const [row] = await db.insert(entities).values(values).returning({ id: entities.id });
    entityId = row.id;
  }

  // Genre lives in the tag system under a namespace (D35), so "show all
  // Fantasy" reuses the M4 tag queries. Merge the picked genres into tags.
  const genreValues = Array.isArray(meta.data && (meta.data as Record<string, unknown>).genre)
    ? ((meta.data as Record<string, unknown>).genre as string[])
    : [];
  const genreTags = genreValues.map((g) => genreToTag(g));
  const techValues = Array.isArray((meta.data as Record<string, unknown>).tech)
    ? ((meta.data as Record<string, unknown>).tech as string[])
    : [];
  const techTags = techValues.map((t) => techToTag(t));
  await syncEntityTags(entityId, [...data.tags, ...genreTags, ...techTags]);

  revalidatePath("/studio");
  revalidatePath(`/studio/${data.type}`);
  revalidatePath(`/studio/${data.type}/${data.slug}`);
  return { ok: true, slug: data.slug };
}

/** Soft delete (D21). You will want this back. */
export async function archiveEntity(id: string, type: string) {
  await requireOwner();
  await db.update(entities).set({ status: "archived" }).where(eq(entities.id, id));
  revalidatePath("/studio");
  revalidatePath(`/studio/${type}`);
  redirect(`/studio/${type}`);
}

export async function registerMedia(input: {
  publicId: string;
  url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  alt: string;
  /** From the photo's EXIF, captured before Cloudinary stripped it. */
  lat?: number | null;
  lng?: number | null;
}) {
  await requireOwner();
  const [row] = await db.insert(media).values(input).returning();
  return row;
}

/**
 * Set (or clear) a single photo's coordinates by hand. Needed because EXIF is
 * gone for anything that travelled through WhatsApp, screenshots, downloads, or
 * editing — without this, those photos could never be pinned at all.
 */
export async function setMediaLocation(
  mediaId: string,
  coords: { lat: number; lng: number } | null,
) {
  await requireOwner();
  if (coords && !isValidCoords(coords.lat, coords.lng)) {
    return { ok: false as const, error: "Those coordinates aren't on the planet." };
  }
  await db
    .update(media)
    .set({ lat: coords?.lat ?? null, lng: coords?.lng ?? null })
    .where(eq(media.id, mediaId));
  return { ok: true as const };
}

/** The current coordinates of a photo, for showing existing pins in the editor. */
export async function getMediaLocation(mediaId: string) {
  await requireOwner();
  const [row] = await db
    .select({ lat: media.lat, lng: media.lng })
    .from(media)
    .where(eq(media.id, mediaId))
    .limit(1);
  if (!row || row.lat === null || row.lng === null) return null;
  return { lat: row.lat, lng: row.lng };
}
