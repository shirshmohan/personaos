import { describe, expect, it } from "vitest";
import { describeIssue } from "@/features/entities/errors";

describe("describeIssue — body blocks", () => {
  it("names the block number and what it needs (url)", () => {
    expect(describeIssue({ path: ["body", 3, "url"], message: "Invalid url" }))
      .toBe("A body block (#4) needs a valid URL.");
  });
  it("names an alt-text failure", () => {
    expect(describeIssue({ path: ["body", 0, "alt"], message: "Required" }))
      .toBe("A body block (#1) needs alt text.");
  });
  it("names a video-link failure", () => {
    expect(describeIssue({ path: ["body", 1, "videoId"], message: "Required" }))
      .toBe("A body block (#2) needs a YouTube or Vimeo link.");
  });
});

describe("describeIssue — named fields", () => {
  it("uses friendly labels for known url fields", () => {
    expect(describeIssue({ path: ["repoUrl"], message: "Invalid url" }))
      .toBe("GitHub repo: Invalid url");
    expect(describeIssue({ path: ["canonicalUrl"], message: "Invalid url" }))
      .toBe("Canonical URL: Invalid url");
  });
  it("does not double-prefix", () => {
    expect(describeIssue({ path: ["title"], message: "Title is required" }))
      .toBe("Title is required");
  });
});
