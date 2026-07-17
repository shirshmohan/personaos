"use client";

import dynamic from "next/dynamic";
import type { TravelPhoto } from "@/features/travel/photos";

/** MapLibre is ~250KB. Same reasoning as the Three.js globe: it loads after the
 *  page is readable, never before (D39). */
const GlobeMap = dynamic(
  () => import("./globe-map").then((m) => ({ default: m.GlobeMap })),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex items-center justify-center rounded-2xl border border-(--color-hairline) bg-(--color-surface-sunken)/40"
        style={{ height: 560 }}
      >
        <p className="font-(family-name:--font-mono) text-xs tracking-widest text-(--color-ink-muted) uppercase">
          Loading the map…
        </p>
      </div>
    ),
  },
);

export function GlobeMapLazy({ photos }: { photos: TravelPhoto[] }) {
  return <GlobeMap photos={photos} />;
}
