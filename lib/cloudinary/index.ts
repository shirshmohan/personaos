import { v2 as cloudinary } from "cloudinary";
import { env } from "@/lib/env";

/**
 * Plumbing only in M1 — configured and typed, but nothing calls it yet.
 * The Studio wires uploads in M3.
 */
export function cloudinaryClient() {
  const e = env();
  cloudinary.config({
    cloud_name: e.CLOUDINARY_CLOUD_NAME,
    api_key: e.CLOUDINARY_API_KEY,
    api_secret: e.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return cloudinary;
}
