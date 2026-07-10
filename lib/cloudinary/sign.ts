"use server";

import { env } from "@/lib/env";
import { requireOwner } from "@/lib/auth/guard";
import { signParams } from "./signature";

/**
 * The browser uploads straight to Cloudinary; the secret never leaves the
 * server. We only sign the request. An unsigned upload preset would let
 * anyone on the internet fill your media library.
 */
export async function signUpload() {
  await requireOwner();
  const e = env();
  if (!e.CLOUDINARY_CLOUD_NAME || !e.CLOUDINARY_API_KEY || !e.CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary is not configured. See .env.example");
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = "persona-os";

  return {
    signature: signParams({ folder, timestamp }, e.CLOUDINARY_API_SECRET),
    timestamp,
    folder,
    apiKey: e.CLOUDINARY_API_KEY,
    cloudName: e.CLOUDINARY_CLOUD_NAME,
  };
}
