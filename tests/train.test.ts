import { describe, expect, it } from "vitest";
import { DSA_PATTERNS, suggestPatterns } from "@/features/train/patterns";

describe("pattern suggestions", () => {
  it("maps Stack tag to both stack patterns (you pick the true one)", () => {
    const s = suggestPatterns(["Array", "Stack"]);
    expect(s).toContain("Monotonic Stack");
    expect(s).toContain("Stack Simulation");
  });
  it("does not assume Monotonic Stack from a plain Stack alone without offering the choice", () => {
    // Both are offered; the user disambiguates. Stack != only Monotonic Stack.
    expect(suggestPatterns(["Stack"]).length).toBeGreaterThan(1);
  });
  it("returns empty for tags with no mapping", () => {
    expect(suggestPatterns(["Brainteaser"])) .toEqual([]);
  });
  it("dedupes across tags", () => {
    const s = suggestPatterns(["Stack", "Monotonic Stack"]);
    expect(s.filter((x) => x === "Monotonic Stack")).toHaveLength(1);
  });
  it("the starter list has the essentials", () => {
    expect(DSA_PATTERNS).toContain("Two Pointers");
    expect(DSA_PATTERNS).toContain("Monotonic Stack");
    expect(DSA_PATTERNS).toContain("Binary Search on Answer");
  });
});
