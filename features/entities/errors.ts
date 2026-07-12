import type { ZodIssue } from "zod";

/**
 * Pure. Lives outside actions.ts because a "use server" module may only export
 * async functions (the recurring rule — see cloudinary/signature.ts, tag-parse.ts).
 *
 * Zod's default message never names the field, and for body blocks the path is
 * `body.3.url` — an index the user can't see. This turns that into
 * "Image block 4: enter a valid URL" instead of a bare "Url: Invalid url".
 */

const FRIENDLY: Record<string, string> = {
  repoUrl: "GitHub repo",
  deployedUrl: "Live link",
  canonicalUrl: "Canonical URL",
  problemUrl: "Problem URL",
  url: "URL",
  slug: "Slug",
  title: "Title",
  summary: "Summary",
};

function friendly(field: string): string {
  return FRIENDLY[field] ?? field.charAt(0).toUpperCase() + field.slice(1);
}

export function describeIssue(issue?: Pick<ZodIssue, "path" | "message">): string {
  if (!issue) return "Invalid input";
  const path = issue.path;

  // Body block errors: path looks like ["body", 3, "url"]. Name the block.
  if (path[0] === "body" && typeof path[1] === "number") {
    const blockNo = path[1] + 1;
    const sub = path.filter((p) => typeof p === "string").at(-1);
    const what =
      sub === "url"
        ? "needs a valid URL"
        : sub === "alt"
          ? "needs alt text"
          : sub === "videoId"
            ? "needs a YouTube or Vimeo link"
            : (issue.message || "is invalid");
    return `A body block (#${blockNo}) ${what}.`;
  }

  const field = path.filter((p) => typeof p === "string").at(-1);
  if (!field) return issue.message;
  const label = friendly(field);
  return issue.message.toLowerCase().startsWith(field.toLowerCase())
    ? issue.message
    : `${label}: ${issue.message}`;
}
