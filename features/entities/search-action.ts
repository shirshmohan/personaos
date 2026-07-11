"use server";

import { requireOwner } from "@/lib/auth/guard";
import { searchEntities } from "./queries";
import type { EntityType } from "./types";

/** Entity search is Studio-only: it sees drafts. Guarded like any mutation. */
export async function searchEntitiesAction(
  query: string,
  excludeId?: string,
): Promise<{ id: string; type: EntityType; slug: string; title: string }[]> {
  await requireOwner();
  const rows = await searchEntities(query, excludeId);
  return rows.map((e) => ({ id: e.id, type: e.type, slug: e.slug, title: e.title }));
}
