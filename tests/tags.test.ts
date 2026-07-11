import { describe, expect, it } from "vitest";
import { parseTagInput } from "@/features/entities/tag-parse";

describe("parseTagInput", () => {
  it("splits on commas and trims", () => {
    expect(parseTagInput("react, postgres ,  drizzle")).toEqual([
      "react", "postgres", "drizzle",
    ]);
  });
  it("drops empties", () => {
    expect(parseTagInput("a,,  ,b")).toEqual(["a", "b"]);
  });
  it("dedupes case-insensitively, keeping the first spelling", () => {
    expect(parseTagInput("Machine Learning, machine learning")).toEqual([
      "Machine Learning",
    ]);
  });
  it("collapses internal whitespace", () => {
    expect(parseTagInput("deep    learning")).toEqual(["deep learning"]);
  });
  it("drops tags that slugify to nothing", () => {
    expect(parseTagInput("!!!, ok")).toEqual(["ok"]);
  });
  it("returns [] for empty input", () => {
    expect(parseTagInput("   ")).toEqual([]);
  });
});
