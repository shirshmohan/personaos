import { describe, expect, it } from "vitest";
import { describeIssue } from "@/features/entities/errors";
import { entityInputSchema } from "@/features/entities/schemas";

describe("describeIssue", () => {
  it("names the field Zod refuses to name", () => {
    const r = entityInputSchema.safeParse({
      type: "career", title: "x", slug: "x", status: "draft",
      body: [], metadata: {}, tags: [], summary: "a".repeat(501),
    });
    expect(r.success).toBe(false);
    if (r.success) return;
    const msg = describeIssue(r.error.issues[0]);
    expect(msg).toMatch(/^Summary/);
    expect(msg).toContain("500 characters or fewer");
  });

  it("does not double-prefix when the message already names the field", () => {
    expect(describeIssue({ path: ["title"], message: "Title is required" }))
      .toBe("Title is required");
  });

  it("falls back gracefully with no path", () => {
    expect(describeIssue({ path: [], message: "Invalid" })).toBe("Invalid");
    expect(describeIssue(undefined)).toBe("Invalid input");
  });

  it("accepts a summary at exactly the limit", () => {
    const r = entityInputSchema.safeParse({
      type: "career", title: "x", slug: "x", status: "draft",
      body: [], metadata: {}, tags: [], summary: "a".repeat(500),
    });
    expect(r.success).toBe(true);
  });
});
