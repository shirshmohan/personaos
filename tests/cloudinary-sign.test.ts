import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { signParams } from "@/lib/cloudinary/signature";

describe("cloudinary signature", () => {
  it("sorts params before signing (order must not change the signature)", () => {
    const a = signParams({ timestamp: 1, folder: "x" }, "secret");
    const b = signParams({ folder: "x", timestamp: 1 }, "secret");
    expect(a).toBe(b);
  });

  it("matches Cloudinary's documented algorithm: sha1(sorted&joined + secret)", () => {
    const expected = createHash("sha1")
      .update("folder=persona-os&timestamp=1700000000" + "s3cr3t")
      .digest("hex");
    expect(signParams({ timestamp: 1700000000, folder: "persona-os" }, "s3cr3t")).toBe(expected);
  });

  it("changes when the secret changes", () => {
    expect(signParams({ timestamp: 1 }, "a")).not.toBe(signParams({ timestamp: 1 }, "b"));
  });
});
