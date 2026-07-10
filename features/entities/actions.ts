"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { entities, media } from "@/lib/db/schema";
import { requireOwner } from "@/lib/auth/guard";
import { entityInputSchema, METADATA_SCHEMAS, type EntityInput } from "./schemas";
import { pruneBlocks } from "./blocks";

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
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const meta = METADATA_SCHEMAS[data.type].safeParse(data.metadata);
  if (!meta.success) {
    return { ok: false, error: meta.error.issues[0]?.message ?? "Invalid fields" };
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

  if (data.id) {
    await db.update(entities).set(values).where(eq(entities.id, data.id));
  } else {
    await db.insert(entities).values(values);
  }

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
}) {
  await requireOwner();
  const [row] = await db.insert(media).values(input).returning();
  return row;
}
