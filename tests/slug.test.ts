import { describe, expect, it } from "vitest";
import { slugify } from "@/features/entities/slug";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("On Building Slowly")).toBe("on-building-slowly");
  });
  it("strips punctuation", () => {
    expect(slugify("Notes on Postgres: Part 2!")).toBe("notes-on-postgres-part-2");
  });
  it("strips accents rather than dropping the letter", () => {
    expect(slugify("Café Diaries")).toBe("cafe-diaries");
  });
  it("collapses repeated separators", () => {
    expect(slugify("a   b___c")).toBe("a-b-c");
  });
  it("trims leading and trailing hyphens", () => {
    expect(slugify("  -- hello -- ")).toBe("hello");
  });
  it("is idempotent", () => {
    const once = slugify("Two Sum — Revisited");
    expect(slugify(once)).toBe(once);
  });
  it("survives a title with no slug-able characters", () => {
    expect(slugify("!!!")).toBe("");
  });
});
