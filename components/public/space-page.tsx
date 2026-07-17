"use client";

import { useEffect, useState } from "react";
import { SpaceBackdrop } from "./space-backdrop";
import { GLOBE_COLORS } from "@/features/travel/globe-style";
import { THEMES } from "@/features/theme/themes";

/**
 * Turns the whole page into space, rather than a globe sitting in a box on a
 * navy rectangle. The starfield is fixed to the viewport, so scrolling the
 * travel list feels like drifting past the entries rather than leaving orbit.
 *
 * Light themes opt out — a daylit page full of stars is nonsense — so Paper and
 * Cream keep the normal surface and simply lose the effect.
 */
export function SpacePage() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const read = () => {
      const id = document.documentElement.dataset.theme;
      setDark(THEMES.find((t) => t.id === id)?.dark ?? false);
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  if (!dark) return null;

  return (
    <>
      {/* Flat black. An earlier pass lit this from above with a violet gradient
          to stop the page reading grey — but that was compensating for a grey
          Earth. With a blue-and-green planet, space just needs to be space. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: GLOBE_COLORS.dark.space }}
      />
      <SpaceBackdrop dark fixed />
    </>
  );
}
