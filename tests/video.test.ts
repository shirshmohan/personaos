import { describe, expect, it } from "vitest";
import { embedUrl, parseVideoUrl } from "@/features/entities/video";

describe("parseVideoUrl", () => {
  it("parses youtu.be short links", () => {
    expect(parseVideoUrl("https://youtu.be/dQw4w9WgXcQ")).toEqual({ provider: "youtube", videoId: "dQw4w9WgXcQ" });
  });
  it("parses full youtube watch URLs with extra params", () => {
    expect(parseVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s")).toEqual({ provider: "youtube", videoId: "dQw4w9WgXcQ" });
  });
  it("parses youtube shorts and embed URLs", () => {
    expect(parseVideoUrl("https://youtube.com/shorts/dQw4w9WgXcQ")?.videoId).toBe("dQw4w9WgXcQ");
    expect(parseVideoUrl("https://www.youtube.com/embed/dQw4w9WgXcQ")?.videoId).toBe("dQw4w9WgXcQ");
  });
  it("parses vimeo URLs", () => {
    expect(parseVideoUrl("https://vimeo.com/123456789")).toEqual({ provider: "vimeo", videoId: "123456789" });
  });
  it("returns null for a non-video URL", () => {
    expect(parseVideoUrl("https://example.com/page")).toBeNull();
    expect(parseVideoUrl("")).toBeNull();
  });
  it("builds privacy-friendly embed URLs", () => {
    expect(embedUrl("youtube", "abc")).toContain("youtube-nocookie.com/embed/abc");
    expect(embedUrl("vimeo", "123")).toContain("player.vimeo.com/video/123");
  });
});
