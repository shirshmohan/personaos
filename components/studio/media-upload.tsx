"use client";

import { useRef, useState, useTransition } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { signUpload } from "@/lib/cloudinary/sign";
import { extractPhotoLocation } from "@/features/entities/exif";
import { registerMedia } from "@/features/entities/actions";
import {
  uploadFormData,
  uploadResponseSchema,
  uploadUrl,
  validateFile,
} from "@/lib/cloudinary/upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cloudinaryError } from "@/lib/cloudinary/upload";

export interface UploadedMedia {
  id: string;
  url: string;
  alt: string;
}

/**
 * Browser -> Cloudinary directly, using a signature minted on the server.
 * The API secret never reaches the client. Alt text is collected before the
 * media row is written, because an image without alt text is a broken image.
 */
/** "RCP_lake.jpg" -> "RCP lake". A real label beats an empty one; the gallery
 *  editor shows every alt inline so they're easy to correct. */
function altFromFilename(name: string): string {
  return name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() || "Photo";
}

export function MediaUpload({
  onUploaded,
  label = "Upload image",
  multiple = false,
}: {
  onUploaded: (media: UploadedMedia) => void;
  label?: string;
  /** Pick many photos at once. Each still gets its own media row, its own EXIF
   *  read, and therefore its OWN coordinates — grouping never merges them. */
  multiple?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [located, setLocated] = useState<{ lat: number; lng: number } | null>(null);
  const [alt, setAlt] = useState("");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  /** Upload one file: read its GPS first, then send it. Returns false on error. */
  async function uploadOne(file: File, altText: string): Promise<boolean> {
    // Read GPS from the FILE first. Cloudinary strips EXIF on upload, so this
    // is the only moment the photo's coordinates still exist.
    const gps = await extractPhotoLocation(file);
    if (gps) setLocated(gps);

    const signed = await signUpload();
    const res = await fetch(uploadUrl(signed.cloudName), {
      method: "POST",
      body: uploadFormData(file, signed),
    });
    const json: unknown = await res.json();

    const parsed = uploadResponseSchema.safeParse(json);
    if (!parsed.success) {
      // Cloudinary tells you exactly what is wrong. Say it, rather than
      // guessing "check your credentials" at a bad cloud name.
      setError(cloudinaryError(json));
      return false;
    }

    const row = await registerMedia({
      publicId: parsed.data.public_id,
      url: parsed.data.secure_url,
      width: parsed.data.width,
      height: parsed.data.height,
      format: parsed.data.format,
      bytes: parsed.data.bytes,
      alt: altText,
      // Each photo carries its OWN coordinates onto its OWN media row.
      lat: gps?.lat ?? null,
      lng: gps?.lng ?? null,
    });

    onUploaded({ id: row.id, url: row.url, alt: row.alt });
    return true;
  }

  function handleFiles(files: File[]) {
    setError(null);
    setLocated(null);

    for (const f of files) {
      const invalid = validateFile(f);
      if (invalid) return setError(invalid);
    }
    // Single-image mode still demands alt up front. Ten photos can't share one
    // description, so multi seeds each from its filename and you fix them inline.
    if (!multiple && !alt.trim())
      return setError("Describe the image first — alt text is required.");

    startTransition(async () => {
      try {
        if (multiple) setProgress({ done: 0, total: files.length });
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const ok = await uploadOne(
            file,
            multiple ? altFromFilename(file.name) : alt.trim(),
          );
          if (!ok) break;
          if (multiple) setProgress({ done: i + 1, total: files.length });
        }
        setAlt("");
        setProgress(null);
        if (inputRef.current) inputRef.current.value = "";
      } catch {
        setError("Upload failed. Is Cloudinary configured?");
        setProgress(null);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {!multiple ? (
        <Input
          value={alt}
          placeholder="Describe this image (required)"
          onChange={(e) => setAlt(e.target.value)}
        />
      ) : null}
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            if (files.length) handleFiles(files);
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
        >
          {pending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <ImagePlus className="size-3.5" />
          )}
          {pending
            ? progress
              ? `Uploading ${progress.done}/${progress.total}…`
              : "Uploading…"
            : label}
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-xs text-(--color-ink-muted)">
          {error}
        </p>
      ) : null}
      {located ? (
        <p className="font-(family-name:--font-mono) text-xs text-(--color-accent)">
          📍 {located.lat.toFixed(4)}, {located.lng.toFixed(4)} — this photo is
          on the map.
        </p>
      ) : null}
    </div>
  );
}
