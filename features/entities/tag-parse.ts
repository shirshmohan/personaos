import { slugify } from "./slug";

/**
 * Pure. Lives apart from tags.ts because that module imports the database —
 * importing a string helper should not boot a Postgres client. (Same lesson
 * as lib/cloudinary/signature.ts.)
 *
 * Split a comma-separated input into clean, unique tag names. Dedupe is by
 * slug, so "Machine Learning" and "machine learning" collapse to one, keeping
 * the first spelling the author used.
 */
export function parseTagInput(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(",")) {
    const name = part.trim().replace(/\s+/g, " ");
    if (!name) continue;
    const key = slugify(name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}
