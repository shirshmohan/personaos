/**
 * Constrained genre vocabulary (D36). Picked from a menu, never typed.
 * Stored as tags under the `genre:` namespace (D35), so "show all Fantasy"
 * reuses the M4 tag queries rather than a parallel system.
 *
 * Extending this list is a one-line edit — no migration, because tags are
 * free-form underneath and the constraint lives only in the picker.
 */
export const GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Sci-Fi", "Horror",
  "Mystery", "Thriller", "Romance", "Slice of Life", "Psychological",
  "Historical", "Isekai", "Cyberpunk", "Post-Apocalyptic", "Supernatural",
  "Sports", "Mecha", "Martial Arts", "School", "Dark Fantasy", "Crime", "War",
  "Coming of Age",
  "Literary Fiction", "Non-Fiction", "Biography", "Self-Help", "Philosophy",
  "Poetry", "Essays",
  "Shonen", "Seinen", "Shojo", "Josei",
] as const;

export type Genre = (typeof GENRES)[number];

export const GENRE_TAG_PREFIX = "genre:";

/** "Dark Fantasy" -> "genre:dark-fantasy" */
export function genreToTag(genre: string): string {
  return GENRE_TAG_PREFIX + genre.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
