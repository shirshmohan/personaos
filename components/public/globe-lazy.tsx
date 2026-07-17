"use client";

import dynamic from "next/dynamic";
import type { TravelPhoto } from "@/features/travel/photos";

/**
 * Three.js is ~140KB — more than the rest of the site combined. Loading it
 * eagerly would make you wait on a 3D engine before you could read a list of
 * places, which breaks the one hard rule: a lot of motion, never slow (D39).
 *
 * So the globe is a separate chunk, fetched after the page is already readable,
 * and never server-rendered (WebGL has no meaning on the server). The reserved
 * box below keeps the layout from jumping when it arrives.
 */
const Globe = dynamic(
  () => import("./globe").then((m) => ({ default: m.Globe })),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex items-center justify-center rounded-2xl border border-(--color-hairline) bg-(--color-surface-sunken)/40"
        style={{ height: 520 }}
      >
        <p className="font-(family-name:--font-mono) text-xs tracking-widest text-(--color-ink-muted) uppercase">
          Loading the globe…
        </p>
      </div>
    ),
  },
);

export function GlobeLazy({ photos }: { photos: TravelPhoto[] }) {
  return <Globe photos={photos} />;
}
