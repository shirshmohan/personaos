import type { ZodIssue } from "zod";

/**
 * Pure. Lives outside actions.ts because a "use server" module may only export
 * async functions — the third time this rule has bitten (see cloudinary/
 * signature.ts and tag-parse.ts).
 *
 * Zod's default message ("String must contain at most 500 character(s)") never
 * names the field, so a form with two errors surfaces one anonymous complaint.
 * Prefix the field unless Zod's own message already mentions it.
 */
export function describeIssue(issue?: Pick<ZodIssue, "path" | "message">): string {
  if (!issue) return "Invalid input";
  const field = issue.path.filter((p) => typeof p === "string").at(-1);
  if (!field) return issue.message;
  const label = field.charAt(0).toUpperCase() + field.slice(1);
  return issue.message.toLowerCase().startsWith(field.toLowerCase())
    ? issue.message
    : `${label}: ${issue.message}`;
}
