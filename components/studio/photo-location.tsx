"use client";

import { useEffect, useState, useTransition } from "react";
import { MapPin, X } from "lucide-react";
import { parseCoords, type Coords } from "@/features/entities/coords";
import { getMediaLocation, setMediaLocation } from "@/features/entities/actions";
import { Input } from "@/components/ui/input";

/**
 * A single photo's coordinates. Every photo gets its own pin, so a trip is many
 * precise points rather than one.
 *
 * Set automatically from EXIF at upload — but anything that came via WhatsApp,
 * a screenshot, a download, or an edit has had its GPS stripped long before it
 * reached us. This is how those photos get placed.
 */
export function PhotoLocation({ mediaId }: { mediaId: string | null }) {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!mediaId) return;
    let live = true;
    getMediaLocation(mediaId)
      .then((c) => live && setCoords(c))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [mediaId]);

  if (!mediaId) return null;

  function save() {
    const parsed = parseCoords(draft);
    if (!parsed) {
      setError("Paste coordinates like 19.0760, 72.8777 — or a Google Maps link.");
      return;
    }
    setError(null);
    start(async () => {
      const res = await setMediaLocation(mediaId!, parsed);
      if (!res.ok) return setError(res.error);
      setCoords(parsed);
      setOpen(false);
      setDraft("");
    });
  }

  function clear() {
    start(async () => {
      await setMediaLocation(mediaId!, null);
      setCoords(null);
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2 text-xs">
        <MapPin
          className="size-3.5 shrink-0"
          style={{ color: coords ? "var(--color-accent)" : "var(--color-ink-muted)" }}
        />
        {coords ? (
          <>
            <span className="font-(family-name:--font-mono) text-(--color-accent)">
              {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
            </span>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="text-(--color-ink-muted) hover:text-(--color-ink)"
            >
              change
            </button>
            <button
              type="button"
              onClick={clear}
              disabled={pending}
              className="text-(--color-ink-muted) hover:text-(--color-ink)"
            >
              clear
            </button>
          </>
        ) : (
          <>
            <span className="text-(--color-ink-muted)">No location</span>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="text-(--color-accent) hover:underline"
            >
              add one
            </button>
          </>
        )}
      </div>

      {open ? (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Input
              autoFocus
              value={draft}
              placeholder="19.0760, 72.8777  — or paste a Google Maps link"
              onChange={(e) => {
                setDraft(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  save();
                }
                if (e.key === "Escape") setOpen(false);
              }}
            />
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="shrink-0 rounded-md border border-(--color-border) px-2.5 py-1.5 text-xs hover:bg-(--color-surface-sunken)"
            >
              {pending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="shrink-0 text-(--color-ink-muted) hover:text-(--color-ink)"
              aria-label="Cancel"
            >
              <X className="size-4" />
            </button>
          </div>
          <p className="text-xs text-(--color-ink-muted)">
            In Google Maps, right-click the exact spot → click the coordinates to
            copy → paste here.
          </p>
          {error ? (
            <p role="alert" className="text-xs text-(--color-ink-muted)">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
