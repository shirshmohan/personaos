import { describe, expect, it } from "vitest";
import { GENRES, genreToTag } from "@/features/entities/genres";

describe("genre → tag", () => {
  it("namespaces under genre:", () => {
    expect(genreToTag("Fantasy")).toBe("genre:fantasy");
  });
  it("slugifies multi-word genres", () => {
    expect(genreToTag("Dark Fantasy")).toBe("genre:dark-fantasy");
    expect(genreToTag("Slice of Life")).toBe("genre:slice-of-life");
  });
  it("handles Sci-Fi's hyphen without doubling", () => {
    expect(genreToTag("Sci-Fi")).toBe("genre:sci-fi");
  });
  it("every genre produces a clean, unique tag", () => {
    const tags = GENRES.map(genreToTag);
    expect(new Set(tags).size).toBe(GENRES.length);
    expect(tags.every((t) => /^genre:[a-z0-9-]+$/.test(t))).toBe(true);
  });
});
