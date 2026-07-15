import { z } from "zod";
import { bodySchema } from "./blocks";
import { ENTITY_STATUSES, type EntityType } from "@/lib/db/schema";
import { GENRES } from "./genres";

/**
 * Field descriptors are the single source of truth (Rule 5, applied to forms).
 * The Zod validator and the rendered form are BOTH derived from this list, so
 * they cannot drift. Add a field here and it appears in the editor, validated.
 */
export type FieldKind = "text" | "url" | "date" | "select" | "multiselect" | "number";

export interface FieldDef {
  name: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  options?: readonly string[];
  placeholder?: string;
  /** Declared for validation but not rendered as a generic input (e.g. lat/lng,
   *  which the LocationField manages). */
  hidden?: boolean;
}

export const ENTITY_FIELDS: Record<EntityType, readonly FieldDef[]> = {
  career: [
    { name: "employer", label: "Employer", kind: "text", required: true },
    { name: "role", label: "Role", kind: "text", required: true },
    { name: "location", label: "Location", kind: "text" },
    { name: "endDate", label: "Ended", kind: "date" },
  ],
  writing: [
    { name: "subtitle", label: "Subtitle", kind: "text" },
    { name: "canonicalUrl", label: "Canonical URL", kind: "url" },
  ],
  travel: [
    { name: "place", label: "Place", kind: "text", required: true },
    { name: "city", label: "City / Region", kind: "text" },
    { name: "country", label: "Country", kind: "text", required: true },
    // lat/lng: set by the LocationField (EXIF or manual), NOT rendered as generic
    // inputs (hidden: true), but DECLARED so metadata validation preserves them.
    { name: "lat", label: "Latitude", kind: "number", hidden: true },
    { name: "lng", label: "Longitude", kind: "number", hidden: true },
  ],
  train: [
    { name: "source", label: "Source", kind: "select", options: ["LeetCode", "Codeforces", "Other"] },
    { name: "problemUrl", label: "Problem URL", kind: "url" },
    { name: "difficulty", label: "Difficulty", kind: "select", options: ["Easy", "Medium", "Hard"] },
    { name: "pattern", label: "Pattern", kind: "text", placeholder: "Two pointers, DP…" },
  ],
  library: [
    { name: "category", label: "Category", kind: "select", required: true,
      options: ["Manhwa", "Manga", "Series", "Book"] },
    { name: "tier", label: "Tier", kind: "select",
      options: ["S", "A", "B", "C", "D", "F"] },
    { name: "author", label: "Author / Studio", kind: "text" },
    { name: "readingStatus", label: "Status", kind: "select",
      options: ["Reading", "Finished", "Dropped", "Planned"] },
    { name: "genre", label: "Genre", kind: "multiselect", options: GENRES },
  ],
  gallery: [
    { name: "medium", label: "Medium", kind: "text" },
  ],
  projects: [
    { name: "repoUrl", label: "GitHub repo", kind: "url", required: true },
    { name: "deployedUrl", label: "Live link", kind: "url" },
    { name: "role", label: "Your role", kind: "text", placeholder: "Solo, lead, contributor…" },
    // tech is a FREE tag field (D42), rendered by TechInput — not a fixed descriptor here.
  ],
};

/** Build a Zod object from the descriptors. One definition, two consumers. */
function zodForFields(fields: readonly FieldDef[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const f of fields) {
    let s: z.ZodTypeAny;
    if (f.kind === "multiselect" && f.options) {
      // A multiselect is an array of allowed values; empty array is fine.
      shape[f.name] = z.array(z.enum(f.options as [string, ...string[]])).default([]);
      continue;
    }
    if (f.kind === "number") {
      // Optional numeric field (lat/lng). Coerce from the form's string input,
      // allow empty/undefined. Declared so it SURVIVES metadata validation —
      // undeclared keys are stripped by z.object.
      shape[f.name] = z.coerce.number().optional().or(z.literal("")).or(z.null());
      continue;
    }
    if (f.kind === "url") s = z.string().url();
    else if (f.kind === "select" && f.options)
      s = z.enum(f.options as [string, ...string[]]);
    else s = z.string();

    // Empty strings mean "not filled in", never a validation error.
    if (f.required) {
      // A required URL must be a real URL, not merely non-empty.
      shape[f.name] =
        f.kind === "url"
          ? z.string().url(`${f.label} must be a valid URL`)
          : z.string().min(1, `${f.label} is required`);
    } else {
      shape[f.name] = s.optional().or(z.literal(""));
    }
  }
  return z.object(shape);
}

export const METADATA_SCHEMAS = Object.fromEntries(
  Object.entries(ENTITY_FIELDS).map(([type, fields]) => [type, zodForFields(fields)]),
) as Record<EntityType, ReturnType<typeof zodForFields>>;

/** What the editor submits. */
export const entityInputSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["career", "writing", "travel", "train", "library", "gallery", "projects"]),
  title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or fewer"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only"),
  summary: z
    .string()
    .max(500, "Summary must be 500 characters or fewer — put the detail in the body")
    .optional()
    .or(z.literal("")),
  status: z.enum(ENTITY_STATUSES),
  body: bodySchema,
  occurredAt: z.string().optional().or(z.literal("")),
  coverMediaId: z.string().nullable().optional(),
  tags: z.array(z.string().min(1)).max(20).default([]),
  metadata: z.record(z.string(), z.unknown()),
});

export type EntityInput = z.infer<typeof entityInputSchema>;

/** Validate metadata against the schema for THIS type. */
export function validateEntity(input: EntityInput) {
  const base = entityInputSchema.safeParse(input);
  if (!base.success) return base;
  return METADATA_SCHEMAS[input.type].safeParse(input.metadata);
}

export const SUMMARY_MAX = 500;
export const TITLE_MAX = 200;
