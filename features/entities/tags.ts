import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { entityTags, tags } from "@/lib/db/schema";
import { slugify } from "./slug";

export { parseTagInput } from "./tag-parse";

/**
 * Replace an entity's tags with exactly this set. Tags are upserted by slug,
 * so "Machine Learning" and "machine learning" are one tag, not two.
 */
export async function syncEntityTags(entityId: string, names: string[]) {
  await db.delete(entityTags).where(eq(entityTags.entityId, entityId));
  if (names.length === 0) return;

  const wanted = names.map((name) => ({ name, slug: slugify(name) }));

  await db
    .insert(tags)
    .values(wanted)
    .onConflictDoNothing({ target: tags.slug });

  const rows = await db
    .select()
    .from(tags)
    .where(inArray(tags.slug, wanted.map((w) => w.slug)));

  await db
    .insert(entityTags)
    .values(rows.map((t) => ({ entityId, tagId: t.id })))
    .onConflictDoNothing();
}

export async function getEntityTags(entityId: string): Promise<string[]> {
  const rows = await db
    .select({ name: tags.name })
    .from(entityTags)
    .innerJoin(tags, eq(entityTags.tagId, tags.id))
    .where(eq(entityTags.entityId, entityId));
  return rows.map((r) => r.name);
}

/**
 * The user's own past tag vocabulary, for the combobox suggestions. Excludes
 * the namespaced genre:/tech: tags — those have their own dedicated pickers,
 * so surfacing them here would be noise and let you double-apply a genre as a
 * plain tag. Read-only; suggesting a tag never modifies anything.
 */
export async function getTagVocabulary(): Promise<string[]> {
  const rows = await db.select({ name: tags.name }).from(tags);
  return rows
    .filter((r) => !r.name.startsWith("genre:") && !r.name.startsWith("tech:"))
    .map((r) => r.name)
    .sort((a, b) => a.localeCompare(b));
}
