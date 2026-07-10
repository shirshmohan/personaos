import crypto from "node:crypto";

/**
 * Pure, sync, and testable. It lives outside sign.ts because a "use server"
 * module may only export async functions — exporting this from there is a
 * build error, not a style preference.
 *
 * Cloudinary's algorithm: sort params, join as k=v&…, append secret, SHA-1.
 */
export function signParams(
  params: Record<string, string | number>,
  secret: string,
): string {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return crypto.createHash("sha1").update(toSign + secret).digest("hex");
}
