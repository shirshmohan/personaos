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
export function MediaUpload({
  onUploaded,
  label = "Upload image",
}: {
  onUploaded: (media: UploadedMedia) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [located, setLocated] = useState<{ lat: number; lng: number } | null>(null);
  const [alt, setAlt] = useState("");

  function handleFile(file: File) {
    setError(null);

    const invalid = validateFile(file);
    if (invalid) return setError(invalid);
    if (!alt.trim())
      return setError("Describe the image first — alt text is required.");

    startTransition(async () => {
      try {
        // Read GPS from the FILE first. Cloudinary strips EXIF on upload, so
        // this is the only moment the photo's coordinates still exist.
        const gps = await extractPhotoLocation(file);
        setLocated(gps);

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
          return;
        }

        const row = await registerMedia({
          publicId: parsed.data.public_id,
          url: parsed.data.secure_url,
          width: parsed.data.width,
          height: parsed.data.height,
          format: parsed.data.format,
          bytes: parsed.data.bytes,
          alt: alt.trim(),
          lat: gps?.lat ?? null,
          lng: gps?.lng ?? null,
        });

        onUploaded({ id: row.id, url: row.url, alt: row.alt });
        setAlt("");
        if (inputRef.current) inputRef.current.value = "";
      } catch {
        setError("Upload failed. Is Cloudinary configured?");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Input
        value={alt}
        placeholder="Describe this image (required)"
        onChange={(e) => setAlt(e.target.value)}
      />
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
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
          {pending ? "Uploading…" : label}
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
