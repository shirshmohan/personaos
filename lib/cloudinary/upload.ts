import { z } from "zod";

/**
 * Pure helpers for the browser -> Cloudinary hop. Kept out of the "use server"
 * modules (which may only export async functions) and out of the component,
 * so the parts that can be tested, are.
 */
export function uploadUrl(cloudName: string): string {
  if (!cloudName) throw new Error("Cloudinary cloud name is missing");
  return `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
}

/** Cloudinary returns far more than this. We keep only what we store. */
export const uploadResponseSchema = z.object({
  public_id: z.string().min(1),
  secure_url: z.string().url(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  format: z.string().min(1),
  bytes: z.number().int().nonnegative(),
});

export type UploadResponse = z.infer<typeof uploadResponseSchema>;

export interface SignedParams {
  signature: string;
  timestamp: number;
  folder: string;
  apiKey: string;
  cloudName: string;
}

/**
 * The exact field set Cloudinary expects for a signed upload. `folder` and
 * `timestamp` are signed, so they must be sent verbatim — any drift between
 * what we sign and what we send yields a 401.
 */
export function uploadFormData(file: File, signed: SignedParams): FormData {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("api_key", signed.apiKey);
  fd.append("timestamp", String(signed.timestamp));
  fd.append("folder", signed.folder);
  fd.append("signature", signed.signature);
  return fd;
}

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export function validateFile(file: File): string | null {
  if (!file.type.startsWith("image/")) return "That file is not an image.";
  if (file.size > MAX_UPLOAD_BYTES) return "Images must be under 10 MB.";
  return null;
}
