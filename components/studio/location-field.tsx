"use client";

import { useState } from "react";
import { MapPin, Loader2, Check } from "lucide-react";
import { extractPhotoLocation } from "@/features/entities/exif";
import { Input } from "@/components/ui/input";

/**
 * Travel location. Two ways to set coordinates:
 *  1. Drop a geotagged photo → GPS read CLIENT-SIDE before any upload (iPhone
 *     originals have it; Cloudinary would strip it, so we read it here first).
 *  2. Type lat/lng by hand (for screenshots / places without a geotagged photo).
 *
 * The photo here is only mined for its coordinates — it is NOT uploaded. The
 * cover uploader is separate.
 */
export function LocationField({
  lat, lng, onChange,
}: {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number | null, lng: number | null) => void;
}) {
  const [status, setStatus] = useState<"idle" | "reading" | "found" | "none">("idle");

  async function readPhoto(file: File) {
    setStatus("reading");
    const loc = await extractPhotoLocation(file);
    if (loc) { onChange(loc.lat, loc.lng); setStatus("found"); }
    else setStatus("none");
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-(--color-border) px-3 py-1.5 text-sm hover:bg-(--color-surface-sunken)">
          {status === "reading" ? <Loader2 className="size-4 animate-spin" /> : <MapPin className="size-4" />}
          Get location from photo
          <input type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) readPhoto(f); }} />
        </label>
        {status === "found" ? (
          <span className="flex items-center gap-1 text-xs text-(--color-accent)">
            <Check className="size-3.5" /> Located from photo
          </span>
        ) : null}
        {status === "none" ? (
          <span className="text-xs text-(--color-ink-muted)">No GPS in that photo — enter it below.</span>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-(--color-ink-muted)">Latitude</label>
          <Input type="number" step="any" value={lat ?? ""} placeholder="19.0760"
            onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value), lng)} />
        </div>
        <div>
          <label className="mb-1 block text-xs text-(--color-ink-muted)">Longitude</label>
          <Input type="number" step="any" value={lng ?? ""} placeholder="72.8777"
            onChange={(e) => onChange(lat, e.target.value === "" ? null : Number(e.target.value))} />
        </div>
      </div>
      {lat !== null && lng !== null ? (
        <p className="font-(family-name:--font-mono) text-xs text-(--color-ink-muted)">
          📍 {lat.toFixed(4)}, {lng.toFixed(4)}
        </p>
      ) : null}
    </div>
  );
}
