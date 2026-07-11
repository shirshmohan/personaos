import { describe, expect, it } from "vitest";
import { techToTag } from "@/features/entities/tech";

describe("tech → tag", () => {
  it("namespaces under tech:", () => {
    expect(techToTag("LangGraph")).toBe("tech:langgraph");
  });
  it("handles dotted and spaced names", () => {
    expect(techToTag("Next.js")).toBe("tech:next-js");
    expect(techToTag("scikit-learn")).toBe("tech:scikit-learn");
  });
  it("is distinct from genre namespace", () => {
    expect(techToTag("Action").startsWith("tech:")).toBe(true);
  });
});
