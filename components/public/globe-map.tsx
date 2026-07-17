"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { TravelPhoto } from "@/features/travel/photos";
import { groupIntoTrips } from "@/features/travel/trips";
import { THEMES } from "@/features/theme/themes";
import {
  buildOsmStyle,
  mergeMapTilerStyle,
  maptilerStyleUrl,
  GLOBE_COLORS,
  FADE_START,
  FADE_END,
} from "@/features/travel/globe-style";

/**
 * One globe, two personalities.
 *
 * From space: a stylised sphere in a star field, atmosphere catching light at
 * the rim, trip cards drifting around it, turning slowly on its own. Descend and
 * all of that gets out of the way — cards fade, the spin stops, and real streets
 * rise through, because the point was never the globe. It was the photographs.
 *
 * The crossfade maths lives in globe-style.ts and the card anchoring in
 * trips.ts, both unit-tested: a card floating over the wrong ocean, or a globe
 * that blinks to nothing mid-zoom, are not things to find by eye.
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

/** Cards are for orbit, not for the ground: gone by the time tiles arrive. */
function cardOpacity(zoom: number): number {
  if (zoom <= FADE_START) return 1;
  if (zoom >= FADE_END) return 0;
  return 1 - (zoom - FADE_START) / (FADE_END - FADE_START);
}

export function GlobeMap({
  photos,
  height = 620,
}: {
  photos: TravelPhoto[];
  height?: number;
}) {
  const router = useRouter();
  const mountRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1.6);
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || photos.length === 0) return;

    let map: maplibregl.Map | null = null;
    let observer: MutationObserver | null = null;
    const markers: maplibregl.Marker[] = [];
    const cardEls: HTMLElement[] = [];
    let alive = true;
    let spinRaf = 0;

    void (async () => {
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
       * With a key: MapTiler's VECTOR style, with the stylised sphere over it.
       * Their raster tiles are a paid feature, so requesting .png would 403 on
       * free. No key, or their API down: OSM. A plain globe beats a blank one.
       */
      const styleFor = async (isDark: boolean) => {
        const colors = isDark ? GLOBE_COLORS.dark : GLOBE_COLORS.light;
        if (!key) return buildOsmStyle(colors, land);
        try {
          const res = await fetch(maptilerStyleUrl(key, isDark));
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

      // The compass earns its place here — on a freely rotating globe you can
      // genuinely lose which way is up.
      map.addControl(
        new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }),
        "top-right",
      );
      map.on("style.load", () => map?.setProjection({ type: "globe" }));
      map.on("zoom", () => {
        if (!map) return;
        const z = map.getZoom();
        setZoom(z);
        const o = cardOpacity(z);
        for (const el of cardEls) el.style.opacity = String(o);
      });

      /* ---------------------------------------------------------------- */
      /* Idle rotation                                                     */
      /* ---------------------------------------------------------------- */
      /**
       * Driven by our own rAF loop with jumpTo, NOT by chaining easeTo off
       * moveend.
       *
       * That chaining is the popular way to spin a globe and it is subtly
       * broken: starting an ease while the previous one is still tearing down
       * leaves MapLibre calling a _onEaseFrame it has already nulled, which
       * throws and then wedges the render loop into "already running" forever.
       * jumpTo has no ease lifecycle to collide with.
       *
       * dt-based, so the spin is the same speed on a 60Hz and a 144Hz screen.
       */
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const DEG_PER_SEC = 2.5;
      const RESUME_AFTER = 4000;

      let userInteracting = false;
      let idleSince = performance.now();
      let lastTs = 0;

      function tick(ts: number) {
        spinRaf = requestAnimationFrame(tick);
        if (!map || reduce) return;

        // Clamped: a backgrounded tab returns with a huge dt and would
        // otherwise snap the globe halfway round the world.
        const dt = lastTs ? Math.min((ts - lastTs) / 1000, 0.1) : 0;
        lastTs = ts;

        if (userInteracting) return;
        if (ts - idleSince < RESUME_AFTER) return;
        // Only in orbit — turning the camera while someone reads a street map
        // would be hostile.
        if (map.getZoom() > FADE_START) return;

        const c = map.getCenter();
        map.jumpTo({ center: [c.lng - DEG_PER_SEC * dt, c.lat] });
      }

      const hold = () => {
        userInteracting = true;
      };
      const release = () => {
        userInteracting = false;
        idleSince = performance.now();
      };
      for (const ev of ["mousedown", "touchstart", "dragstart"] as const)
        map.on(ev, hold);
      for (const ev of ["mouseup", "touchend", "dragend"] as const)
        map.on(ev, release);
      // A wheel never "holds" — it just resets the idle clock.
      map.on("wheel", () => {
        idleSince = performance.now();
      });

      if (!reduce) spinRaf = requestAnimationFrame(tick);

      /* ---------------------------------------------------------------- */
      /* Pins — one per photo, at its own coordinates                      */
      /* ---------------------------------------------------------------- */
      for (const photo of photos) {
        const el = document.createElement("button");
        el.type = "button";
        el.className = "globe-pin";
        el.setAttribute("aria-label", photo.alt || photo.entryTitle);
        el.style.cssText =
          "width:11px;height:11px;border-radius:9999px;cursor:pointer;padding:0;" +
          "border:2px solid var(--color-surface);background:var(--color-accent);";

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

      /* ---------------------------------------------------------------- */
      /* Trip cards — one per trip, drifting in orbit                      */
      /* ---------------------------------------------------------------- */
      for (const trip of groupIntoTrips(photos)) {
        const el = document.createElement("button");
        el.type = "button";
        el.className = "globe-card";
        el.setAttribute("aria-label", `${trip.title}, ${trip.photoCount} photos`);
        el.style.cssText =
          "cursor:pointer;padding:0;border-radius:10px;overflow:hidden;" +
          "background:color-mix(in oklab, var(--color-surface) 55%, transparent);" +
          "border:1px solid color-mix(in oklab, var(--color-accent) 35%, transparent);" +
          "box-shadow:0 0 18px color-mix(in oklab, var(--color-accent) 18%, transparent);" +
          "backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);" +
          "transition:opacity .4s var(--ease-quiet);";
        el.innerHTML =
          '<div style="display:flex;align-items:center;gap:8px;padding:6px 9px 6px 6px">' +
          `<img src="${trip.thumbUrl}" alt="" style="width:34px;height:34px;border-radius:6px;object-fit:cover;display:block" />` +
          '<span style="text-align:left;line-height:1.25">' +
          `<span style="display:block;font-size:12px;font-weight:600;color:var(--color-ink)">${escapeHtml(trip.title)}</span>` +
          `<span style="display:block;font-size:11px;opacity:.65;color:var(--color-ink)">${trip.photoCount} photo${trip.photoCount === 1 ? "" : "s"}</span>` +
          "</span></div>";

        el.addEventListener("click", (e) => {
          e.stopPropagation();
          router.push(`/travel/${trip.slug}`);
        });

        const marker = new maplibregl.Marker({ element: el, offset: [0, -34] })
          .setLngLat([trip.lng, trip.lat])
          .addTo(map);
        markers.push(marker);
        cardEls.push(el);
      }

      // Open in orbit, framing everything, never mid-street.
      map.once("load", () => {
        if (!map) return;
        if (photos.length > 1) {
          const b = new maplibregl.LngLatBounds();
          for (const p of photos) b.extend([p.lng, p.lat]);
          map.fitBounds(b, { padding: 90, maxZoom: FADE_START - 0.5, duration: 0 });
        } else {
          map.setCenter([photos[0].lng, photos[0].lat]);
          map.setZoom(2.5);
        }
      });

      observer = new MutationObserver(() => {
        const d = isDarkTheme();
        setDark(d);
        void styleFor(d).then((next) => {
          if (!alive) return;
          map?.setStyle(next);
          map?.once("style.load", () => map?.setProjection({ type: "globe" }));
        });
      });
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"],
      });
      setDark(isDarkTheme());
    })();

    return () => {
      alive = false;
      cancelAnimationFrame(spinRaf);
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
    // No border, no panel: on a dark theme the page itself is space, so a box
    // around the globe would just be a rectangle drawn on the sky. Light themes
    // keep a surface, because a globe floating on white needs an edge.
    <div
      className={
        dark
          ? "relative"
          : "relative overflow-hidden rounded-2xl border border-(--color-hairline) bg-(--color-surface-sunken)/40"
      }
      style={{ height }}
    >
      <div ref={mountRef} className="absolute inset-0 h-full w-full" />
      {/* Bottom-left: the trip cards live up top, anchored to wherever your
          photos happen to be, and a fixed label there collides with them. */}
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-(--color-surface)/70 px-2 py-1 font-(family-name:--font-mono) text-xs tracking-widest text-(--color-ink-muted) uppercase backdrop-blur-sm">
        {zoomLabel(zoom)}
      </div>
    </div>
  );
}
