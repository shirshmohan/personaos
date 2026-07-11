"use server";

import { revalidatePath } from "next/cache";
import { and, eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { entities, relationships, type RelationshipType } from "@/lib/db/schema";
import { requireOwner } from "@/lib/auth/guard";

export type RelResult = { ok: true } | { ok: false; error: string };

export async function addRelationship(
  fromEntityId: string,
  toEntityId: string,
  type: RelationshipType,
): Promise<RelResult> {
  await requireOwner();

  if (fromEntityId === toEntityId) {
    return { ok: false, error: "An entity cannot relate to itself." };
  }

  // The edge is undirected to a reader, so A->B and B->A are the same edge.
  const existing = await db
    .select({ id: relationships.id })
    .from(relationships)
    .where(
      and(
        or(
          and(
            eq(relationships.fromEntityId, fromEntityId),
            eq(relationships.toEntityId, toEntityId),
          ),
          and(
            eq(relationships.fromEntityId, toEntityId),
            eq(relationships.toEntityId, fromEntityId),
          ),
        ),
        eq(relationships.type, type),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    return { ok: false, error: "These are already connected that way." };
  }

  await db.insert(relationships).values({ fromEntityId, toEntityId, type });
  revalidatePath("/studio");
  return { ok: true };
}

export async function removeRelationship(id: string): Promise<RelResult> {
  await requireOwner();
  await db.delete(relationships).where(eq(relationships.id, id));
  revalidatePath("/studio");
  return { ok: true };
}

/** Restore an archived entity. Previously this required raw SQL. */
export async function restoreEntity(id: string, type: string) {
  await requireOwner();
  await db.update(entities).set({ status: "draft" }).where(eq(entities.id, id));
  revalidatePath("/studio");
  revalidatePath(`/studio/${type}`);
}
