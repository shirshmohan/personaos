import { describe, expect, it } from "vitest";
import { METADATA_SCHEMAS } from "@/features/entities/schemas";

describe("travel location fields survive validation", () => {
  it("preserves lat/lng (regression: z.object was stripping them)", () => {
    const r = METADATA_SCHEMAS.travel.safeParse({
      place: "RCP Park", city: "Ghansoli", country: "India", lat: 19.076, lng: 72.877,
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect((r.data as Record<string, unknown>).lat).toBe(19.076);
      expect((r.data as Record<string, unknown>).lng).toBe(72.877);
    }
  });
  it("allows a travel entry with no coordinates", () => {
    const r = METADATA_SCHEMAS.travel.safeParse({ place: "X", country: "India" });
    expect(r.success).toBe(true);
  });
});
