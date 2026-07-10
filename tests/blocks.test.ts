import { describe, expect, it } from "vitest";
import { bodySchema, newBlock } from "@/features/entities/blocks";

describe("body blocks", () => {
  it("accepts a well-formed body", () => {
    const body = [
      { id: "1", type: "heading", level: 2, text: "Intro" },
      { id: "2", type: "paragraph", text: "Hello." },
      { id: "3", type: "divider" },
    ];
    expect(bodySchema.safeParse(body).success).toBe(true);
  });

  it("rejects an unknown block type", () => {
    expect(bodySchema.safeParse([{ id: "1", type: "marquee" }]).success).toBe(false);
  });

  it("rejects a heading at an illegal level", () => {
    expect(
      bodySchema.safeParse([{ id: "1", type: "heading", level: 1, text: "H1" }]).success,
    ).toBe(false);
  });

  it("rejects an image with a non-URL", () => {
    expect(
      bodySchema.safeParse([
        { id: "1", type: "image", mediaId: null, url: "not-a-url", alt: "x" },
      ]).success,
    ).toBe(false);
  });

  it("requires alt text on images", () => {
    expect(
      bodySchema.safeParse([
        { id: "1", type: "image", mediaId: null, url: "https://a.co/b.png" },
      ]).success,
    ).toBe(false);
  });

  it("newBlock produces a valid block for every type", () => {
    for (const t of ["paragraph", "heading", "quote", "code", "divider"] as const) {
      expect(bodySchema.safeParse([newBlock(t)]).success).toBe(true);
    }
  });
});
