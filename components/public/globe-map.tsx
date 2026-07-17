"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { TravelPhoto } from "@/features/travel/photos";
import { THEMES } from "@/features/theme/themes";
import {
  buildOsmStyle,
  mergeMapTilerStyle,
  maptilerStyleUrl,
  GLOBE_COLORS,
  FADE_START,
} from "@/features/travel/globe-style";

/**
 * One globe, two personalities.
 *
 * From space it's the stylised sphere — dark water, glowing coastline, a faint
 * graticule, no labels. Descend and that layer crossfades into real tiles, so
 * the same view carries you from orbit to the exact street a photo was taken
 * on. The crossfade maths lives in globe-style.ts and is unit-tested; a globe
 * that blinks to nothing mid-zoom is not something to discover by eye.
 *
 * This replaces the Three.js globe: the same look at distance, but it can
 * actually arrive somewhere.
 */
function isDarkTheme(): boolean {
  const id = document.documentElement.dataset.theme;
  return THEMES.find((t) => t.id === id)?.dark ?? false;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function zoomLabel(z: number): string {
  if (z < 3) return "world";
  if (z < 5) return "country";
  if (z < 7) return "state";
  if (z < 10) return "city";
  if (z < 13) return "district";
  return "street";
}

export function GlobeMap({
  photos,
  height = 560,
}: {
  photos: TravelPhoto[];
  height?: number;
}) {
  const router = useRouter();
  const mountRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1.6);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || photos.length === 0) return;

    let map: maplibregl.Map | null = null;
    let observer: MutationObserver | null = null;
    const markers: maplibregl.Marker[] = [];
    let alive = true;

    void (async () => {
      // The same coastline data the Three.js globe used — an npm package, not a
      // texture to fetch. Loaded here so it never blocks first paint.
      const [worldMod, topojson] = await Promise.all([
        import("world-atlas/land-110m.json"),
        import("topojson-client"),
      ]);
      if (!alive || !mountRef.current) return;

      /* eslint-disable @typescript-eslint/no-explicit-any */
      const world: any = (worldMod as any).default ?? worldMod;
      const land = (topojson as any).feature(world, world.objects.land);
      /* eslint-enable @typescript-eslint/no-explicit-any */

      const key = process.env.NEXT_PUBLIC_MAPTILER_KEY;

      /**
       * With a key: fetch MapTiler's own VECTOR style and layer the stylised
       * sphere over it. Their raster tiles are a paid feature, so requesting
       * .png would 403 on the free tier — vector is what free actually serves.
       * Without a key, or if their API is unreachable, fall back to OSM rather
       * than showing nothing.
       */
      const styleFor = async (dark: boolean) => {
        const colors = dark ? GLOBE_COLORS.dark : GLOBE_COLORS.light;
        if (!key) return buildOsmStyle(colors, land);
        try {
          const res = await fetch(maptilerStyleUrl(key, dark));
          if (!res.ok) throw new Error(String(res.status));
          return mergeMapTilerStyle(await res.json(), colors, land);
        } catch {
          return buildOsmStyle(colors, land);
        }
      };

      const initial = await styleFor(isDarkTheme());
      if (!alive || !mountRef.current) return;

      map = new maplibregl.Map({
        container: mount,
        style: initial,
        center: [78, 22],
        zoom: 1.6,
        attributionControl: { compact: true },
      });

      map.addControl(new maplibregl.NavigationControl(), "top-right");
      map.on("style.load", () => map?.setProjection({ type: "globe" }));
      map.on("zoom", () => map && setZoom(map.getZoom()));

      // One marker per photo, at its own coordinates. Never merged, never
      // inherited — the entire reason each photo carries its own GPS.
      for (const photo of photos) {
        const el = document.createElement("button");
        el.type = "button";
        el.setAttribute("aria-label", photo.alt || photo.entryTitle);
        el.style.cssText =
          "width:12px;height:12px;border-radius:9999px;cursor:pointer;" +
          "border:2px solid var(--color-surface);background:var(--color-accent);" +
          "box-shadow:0 0 10px var(--color-accent);padding:0";

        const popup = new maplibregl.Popup({
          offset: 14,
          closeButton: false,
          maxWidth: "220px",
        }).setHTML(
          '<figure style="margin:0">' +
            `<img src="${photo.url}" alt="" style="width:100%;border-radius:6px;display:block" />` +
            '<figcaption style="margin-top:6px;font-size:12px;line-height:1.4">' +
            `<strong>${escapeHtml(photo.alt || photo.entryTitle)}</strong><br/>` +
            `<span style="opacity:.7">${escapeHtml(
              [photo.city, photo.country].filter(Boolean).join(", "),
            )}</span>` +
            "</figcaption></figure>",
        );

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([photo.lng, photo.lat])
          .setPopup(popup)
          .addTo(map);

        el.addEventListener("mouseenter", () => marker.togglePopup());
        el.addEventListener("mouseleave", () => popup.remove());
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          router.push(`/travel/${photo.entrySlug}`);
        });
        markers.push(marker);
      }

      // Frame what actually exists rather than guessing a viewport — but stay
      // far enough out to open on the stylised sphere, not on a street.
      map.once("load", () => {
        if (!map) return;
        if (photos.length > 1) {
          const b = new maplibregl.LngLatBounds();
          for (const p of photos) b.extend([p.lng, p.lat]);
          map.fitBounds(b, { padding: 80, maxZoom: FADE_START - 0.5, duration: 0 });
        } else {
          map.setCenter([photos[0].lng, photos[0].lat]);
          map.setZoom(2.5);
        }
      });

      // Follow the theme switcher, or the map sits light on a dark page.
      observer = new MutationObserver(() => {
        void styleFor(isDarkTheme()).then((next) => {
          if (!alive) return;
          map?.setStyle(next);
          map?.once("style.load", () => map?.setProjection({ type: "globe" }));
        });
      });
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"],
      });
    })();

    return () => {
      alive = false;
      observer?.disconnect();
      for (const m of markers) m.remove();
      map?.remove();
    };
  }, [photos, router]);

  if (photos.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl border border-dashed border-(--color-border)"
        style={{ height }}
      >
        <p className="max-w-xs text-center text-sm text-(--color-ink-muted)">
          No located photos yet. Give a photo coordinates in the Studio and it
          appears here.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={mountRef}
        className="overflow-hidden rounded-2xl border border-(--color-hairline)"
        style={{ height }}
      />
      {/* Where you are in the descent: world -> country -> district -> street. */}
      <div className="pointer-events-none absolute top-3 left-3 rounded-md bg-(--color-surface)/85 px-2 py-1 font-(family-name:--font-mono) text-xs tracking-widest text-(--color-ink-muted) uppercase backdrop-blur-sm">
        {zoomLabel(zoom)}
      </div>
    </div>
  );
}
