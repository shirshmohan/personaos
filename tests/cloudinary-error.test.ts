import { describe, expect, it } from "vitest";
import { cloudinaryError, uploadUrl } from "@/lib/cloudinary/upload";

describe("cloudinaryError", () => {
  it("surfaces Cloudinary's real message rather than guessing", () => {
    expect(cloudinaryError({ error: { message: "Invalid cloud_name personify" } }))
      .toBe("Cloudinary: Invalid cloud_name personify");
  });
  it("falls back when the payload has no message", () => {
    expect(cloudinaryError({})).toBe("Cloudinary rejected the upload.");
    expect(cloudinaryError(null)).toBe("Cloudinary rejected the upload.");
  });
});

describe("uploadUrl guards the cloud name", () => {
  it("rejects a name with a slash (would rewrite the path)", () => {
    expect(() => uploadUrl("evil/../../x")).toThrow(/Invalid Cloudinary cloud name/);
  });
  it("rejects spaces", () => {
    expect(() => uploadUrl("my cloud")).toThrow();
  });
  it("accepts a normal cloud name", () => {
    expect(uploadUrl("dxk3n9p2q")).toContain("/v1_1/dxk3n9p2q/");
  });
});
