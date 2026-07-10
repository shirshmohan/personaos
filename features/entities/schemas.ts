import { z } from "zod";
import { bodySchema } from "./blocks";
import { ENTITY_STATUSES, type EntityType } from "@/lib/db/schema";

/**
 * Field descriptors are the single source of truth (Rule 5, applied to forms).
 * The Zod validator and the rendered form are BOTH derived from this list, so
 * they cannot drift. Add a field here and it appears in the editor, validated.
 */
export type FieldKind = "text" | "url" | "date" | "select";

export interface FieldDef {
  name: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  options?: readonly string[];
  placeholder?: string;
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
    { name: "country", label: "Country", kind: "text", required: true },
  ],
  train: [
    { name: "source", label: "Source", kind: "select", options: ["LeetCode", "Codeforces", "Other"] },
    { name: "problemUrl", label: "Problem URL", kind: "url" },
    { name: "difficulty", label: "Difficulty", kind: "select", options: ["Easy", "Medium", "Hard"] },
    { name: "pattern", label: "Pattern", kind: "text", placeholder: "Two pointers, DP…" },
  ],
  library: [
    { name: "author", label: "Author", kind: "text", required: true },
    { name: "readingStatus", label: "Status", kind: "select", options: ["Reading", "Finished", "Abandoned"] },
  ],
  gallery: [
    { name: "medium", label: "Medium", kind: "text" },
  ],
};

/** Build a Zod object from the descriptors. One definition, two consumers. */
function zodForFields(fields: readonly FieldDef[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const f of fields) {
    let s: z.ZodTypeAny;
    if (f.kind === "url") s = z.string().url();
    else if (f.kind === "select" && f.options)
      s = z.enum(f.options as [string, ...string[]]);
    else s = z.string();

    // Empty strings mean "not filled in", never a validation error.
    shape[f.name] = f.required
      ? z.string().min(1, `${f.label} is required`)
      : s.optional().or(z.literal(""));
  }
  return z.object(shape);
}

export const METADATA_SCHEMAS = Object.fromEntries(
  Object.entries(ENTITY_FIELDS).map(([type, fields]) => [type, zodForFields(fields)]),
) as Record<EntityType, ReturnType<typeof zodForFields>>;

/** What the editor submits. */
export const entityInputSchema = z.object({
  id: z.string().optional(),
  type: z.enum(["career", "writing", "travel", "train", "library", "gallery"]),
  title: z.string().min(1, "Title is required").max(200),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only"),
  summary: z.string().max(500).optional().or(z.literal("")),
  status: z.enum(ENTITY_STATUSES),
  body: bodySchema,
  occurredAt: z.string().optional().or(z.literal("")),
  coverMediaId: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()),
});

export type EntityInput = z.infer<typeof entityInputSchema>;

/** Validate metadata against the schema for THIS type. */
export function validateEntity(input: EntityInput) {
  const base = entityInputSchema.safeParse(input);
  if (!base.success) return base;
  return METADATA_SCHEMAS[input.type].safeParse(input.metadata);
}
