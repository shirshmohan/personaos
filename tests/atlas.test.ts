import { describe, expect, it } from "vitest";
import { shapeEdges } from "@/features/atlas/shape";

const raw = [
  { fromEntityId: "a", toEntityId: "b", type: "references" as const },
  { fromEntityId: "b", toEntityId: "c", type: "related_to" as const },
  { fromEntityId: "b", toEntityId: "draft", type: "related_to" as const }, // to a draft
];

describe("shapeEdges — the draft-safety guarantee", () => {
  const pub = new Set(["a", "b", "c"]); // draft not published

  it("drops any edge touching an unpublished node", () => {
    const { edges } = shapeEdges(pub, raw);
    expect(edges).toHaveLength(2);
    expect(edges.some((e) => e.target === "draft" || e.source === "draft")).toBe(false);
  });

  it("computes degree from published edges only", () => {
    const { degree } = shapeEdges(pub, raw);
    expect(degree.get("b")).toBe(2); // a-b and b-c, NOT b-draft
    expect(degree.get("a")).toBe(1);
    expect(degree.get("draft")).toBeUndefined();
  });

  it("returns empty for no edges", () => {
    const { edges, degree } = shapeEdges(pub, []);
    expect(edges).toHaveLength(0);
    expect(degree.size).toBe(0);
  });
});
