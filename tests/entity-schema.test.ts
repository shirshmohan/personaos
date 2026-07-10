import { describe, expect, it } from "vitest";
import { METADATA_SCHEMAS, entityInputSchema } from "@/features/entities/schemas";

describe("per-type metadata (derived from field descriptors)", () => {
  it("requires career employer and role", () => {
    expect(METADATA_SCHEMAS.career.safeParse({}).success).toBe(false);
    expect(
      METADATA_SCHEMAS.career.safeParse({ employer: "Jio", role: "Intern" }).success,
    ).toBe(true);
  });

  it("treats empty optional fields as absent, not invalid", () => {
    const r = METADATA_SCHEMAS.train.safeParse({ problemUrl: "", pattern: "" });
    expect(r.success).toBe(true);
  });

  it("rejects a malformed URL when one is supplied", () => {
    expect(METADATA_SCHEMAS.train.safeParse({ problemUrl: "nope" }).success).toBe(false);
  });

  it("constrains select fields to their options", () => {
    expect(METADATA_SCHEMAS.train.safeParse({ difficulty: "Trivial" }).success).toBe(false);
    expect(METADATA_SCHEMAS.train.safeParse({ difficulty: "Hard" }).success).toBe(true);
  });
});

describe("entity input", () => {
  const base = {
    type: "writing" as const,
    title: "Hello",
    slug: "hello",
    status: "draft" as const,
    body: [],
    metadata: {},
  };

  it("accepts a minimal valid entity", () => {
    expect(entityInputSchema.safeParse(base).success).toBe(true);
  });

  it("rejects an empty title", () => {
    expect(entityInputSchema.safeParse({ ...base, title: "" }).success).toBe(false);
  });

  it("rejects a slug with uppercase or spaces", () => {
    expect(entityInputSchema.safeParse({ ...base, slug: "Hello World" }).success).toBe(false);
  });
});
