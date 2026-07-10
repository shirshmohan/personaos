import { describe, expect, it } from "vitest";
import {
  MAX_UPLOAD_BYTES,
  uploadFormData,
  uploadResponseSchema,
  uploadUrl,
  validateFile,
} from "@/lib/cloudinary/upload";

const signed = {
  signature: "abc",
  timestamp: 1700000000,
  folder: "persona-os",
  apiKey: "key",
  cloudName: "demo",
};

describe("uploadUrl", () => {
  it("builds the v1_1 image upload endpoint", () => {
    expect(uploadUrl("demo")).toBe("https://api.cloudinary.com/v1_1/demo/image/upload");
  });
  it("throws rather than posting to a malformed URL", () => {
    expect(() => uploadUrl("")).toThrow();
  });
});

describe("uploadFormData", () => {
  const file = new File(["x"], "a.png", { type: "image/png" });

  it("sends exactly the signed params, verbatim", () => {
    const fd = uploadFormData(file, signed);
    // Drift between signed and sent params is a 401 from Cloudinary.
    expect(fd.get("timestamp")).toBe(String(signed.timestamp));
    expect(fd.get("folder")).toBe(signed.folder);
    expect(fd.get("signature")).toBe(signed.signature);
    expect(fd.get("api_key")).toBe(signed.apiKey);
  });

  it("never sends the API secret", () => {
    const fd = uploadFormData(file, signed);
    expect([...fd.keys()]).not.toContain("api_secret");
  });
});

describe("uploadResponseSchema", () => {
  it("accepts a real-shaped response", () => {
    expect(
      uploadResponseSchema.safeParse({
        public_id: "persona-os/x",
        secure_url: "https://res.cloudinary.com/demo/image/upload/x.png",
        width: 800,
        height: 600,
        format: "png",
        bytes: 1234,
        extra_field_we_ignore: true,
      }).success,
    ).toBe(true);
  });

  it("rejects an error payload masquerading as success", () => {
    expect(uploadResponseSchema.safeParse({ error: { message: "nope" } }).success).toBe(false);
  });

  it("rejects zero-width images", () => {
    expect(
      uploadResponseSchema.safeParse({
        public_id: "a", secure_url: "https://a.co/b.png",
        width: 0, height: 10, format: "png", bytes: 1,
      }).success,
    ).toBe(false);
  });
});

describe("validateFile", () => {
  it("rejects non-images", () => {
    expect(validateFile(new File(["x"], "a.pdf", { type: "application/pdf" }))).toMatch(/not an image/);
  });
  it("rejects oversized images", () => {
    const big = new File([new Uint8Array(MAX_UPLOAD_BYTES + 1)], "b.png", { type: "image/png" });
    expect(validateFile(big)).toMatch(/10 MB/);
  });
  it("accepts a normal image", () => {
    expect(validateFile(new File(["x"], "c.png", { type: "image/png" }))).toBeNull();
  });
});
