import { z } from "zod";

/**
 * Structured blocks, not markdown (D20). The cost is a real editor; the payoff
 * is that M6's Atlas can walk the content tree to find relationships, and M5
 * can render each block type with its own component. Markdown would force us
 * to re-parse prose forever.
 */
export const blockSchema = z.discriminatedUnion("type", [
  z.object({ id: z.string(), type: z.literal("paragraph"), text: z.string() }),
  z.object({
    id: z.string(),
    type: z.literal("heading"),
    level: z.union([z.literal(2), z.literal(3)]),
    /** Empty while the author is still typing. Emptiness is a UI state, not
     *  a validation error — blank blocks are dropped on save instead. */
    text: z.string(),
  }),
  z.object({ id: z.string(), type: z.literal("quote"), text: z.string() }),
  z.object({
    id: z.string(),
    type: z.literal("code"),
    language: z.string().default("text"),
    code: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal("image"),
    mediaId: z.string().nullable(),
    url: z.string().url(),
    /** Required, never optional. Accessibility is a floor. */
    alt: z.string(),
  }),
  z.object({ id: z.string(), type: z.literal("divider") }),
]);

export const bodySchema = z.array(blockSchema);

export type Block = z.infer<typeof blockSchema>;
export type BlockType = Block["type"];
export type Body = z.infer<typeof bodySchema>;

export const BLOCK_LABELS: Record<BlockType, string> = {
  paragraph: "Text",
  heading: "Heading",
  quote: "Quote",
  code: "Code",
  image: "Image",
  divider: "Divider",
};

export function newBlock(type: BlockType): Block {
  const id = crypto.randomUUID();
  switch (type) {
    case "paragraph":
      return { id, type, text: "" };
    case "heading":
      return { id, type, level: 2, text: "" };
    case "quote":
      return { id, type, text: "" };
    case "code":
      return { id, type, language: "text", code: "" };
    case "image":
      return { id, type, mediaId: null, url: "", alt: "" };
    case "divider":
      return { id, type };
  }
}

/** Blank paragraphs/headings/quotes are noise. Drop them when persisting. */
export function pruneBlocks(blocks: Body): Body {
  return blocks.filter((b) => {
    if (b.type === "paragraph" || b.type === "heading" || b.type === "quote")
      return b.text.trim().length > 0;
    if (b.type === "code") return b.code.trim().length > 0;
    if (b.type === "image") return b.url.trim().length > 0;
    return true;
  });
}
