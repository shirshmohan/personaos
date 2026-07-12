import { describe, expect, it } from "vitest";
import { TIER_ORDER, tierStyle } from "@/features/entities/tiers";

describe("tierStyle", () => {
  it("resolves every valid tier to a colour", () => {
    for (const t of TIER_ORDER) {
      expect(tierStyle(t)?.color).toMatch(/^oklch/);
    }
  });
  it("returns null for unranked / bad input", () => {
    expect(tierStyle("—")).toBeNull();
    expect(tierStyle(null)).toBeNull();
    expect(tierStyle("Z")).toBeNull();
  });
  it("orders S first, F last", () => {
    expect(TIER_ORDER[0]).toBe("S");
    expect(TIER_ORDER.at(-1)).toBe("F");
  });
});
