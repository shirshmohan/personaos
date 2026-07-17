import type { StyleSpecification, LayerSpecification } from "maplibre-gl";

/**
 * The hybrid globe: stylised from space, real on the ground.
 *
 * Three.js gave a beautiful object that could never zoom (coastlines contain no
 * streets). A plain map gave streets but looked like any map. This is both,
 * because a MapLibre layer's opacity can be a function of zoom — so the
 * stylised sphere and the real map live in one view and crossfade.
 *
 *   z0–3.5   stylised only: dark sphere, glowing coastline, no labels
 *   z3.5–5.5 crossfade
 *   z5.5+    the real map: cities, districts, streets
 *
 * The stylised layers sit ON TOP and fade OUT, revealing the real map beneath.
 * That ordering matters: MapTiler ships a whole style whose layers we don't want
 * to rewrite, so we cover it rather than recolour it.
 *
 * Pure and unit-tested — the two fades must be complementary, or the globe
 * blinks to an empty screen mid-descent.
 */

export interface GlobeColors {
  /** The ocean / the sphere's body. */
  water: string;
  /** Landmass fill when stylised. */
  land: string;
  /** The glowing coastline. */
  coast: string;
  /** Latitude/longitude grid. */
  grid: string;
}

export const GLOBE_COLORS: Record<"dark" | "light", GlobeColors> = {
  dark: { water: "#0d1420", land: "#182536", coast: "#5b7d9e", grid: "#27384a" },
  light: { water: "#e8edf2", land: "#f7f9fb", coast: "#64809b", grid: "#b9c6d4" },
};

/** Where the stylised sphere hands over to the real map. */
export const FADE_START = 3.5;
export const FADE_END = 5.5;

/** Below this, the real map is never even requested — see REAL_MINZOOM. */
export const REAL_MINZOOM = FADE_START - 0.5;

/** Stylised layers: fully on below FADE_START, gone by FADE_END. */
export function stylisedOpacity(max: number): unknown {
  return ["interpolate", ["linear"], ["zoom"], FADE_START, max, FADE_END, 0];
}

/** The exact inverse, for anything that should appear as you descend. */
export function realOpacity(): unknown {
  return ["interpolate", ["linear"], ["zoom"], FADE_START, 0, FADE_END, 1];
}

/**
 * A lat/lng graticule as GeoJSON. MapLibre has no built-in one, and it's what
 * makes the sphere read as technical rather than as clip art.
 */
export function graticule(step = 20): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];
  for (let lng = -180; lng <= 180; lng += step) {
    const coordinates: [number, number][] = [];
    for (let lat = -80; lat <= 80; lat += 5) coordinates.push([lng, lat]);
    features.push({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates } });
  }
  for (let lat = -60; lat <= 60; lat += step) {
    const coordinates: [number, number][] = [];
    for (let lng = -180; lng <= 180; lng += 5) coordinates.push([lng, lat]);
    features.push({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates } });
  }
  return { type: "FeatureCollection", features };
}

/** The stylised sphere itself — the part that looks like the Three.js globe. */
export function stylisedLayers(colors: GlobeColors): LayerSpecification[] {
  return [
    {
      id: "globe-water",
      type: "background",
      paint: {
        "background-color": colors.water,
        "background-opacity": stylisedOpacity(1) as never,
      },
    },
    {
      id: "globe-land",
      type: "fill",
      source: "land",
      paint: {
        "fill-color": colors.land,
        "fill-opacity": stylisedOpacity(1) as never,
      },
    },
    {
      id: "globe-grid",
      type: "line",
      source: "grid",
      paint: {
        "line-color": colors.grid,
        "line-width": 0.5,
        "line-opacity": stylisedOpacity(0.35) as never,
      },
    },
    {
      id: "globe-coast",
      type: "line",
      source: "land",
      paint: {
        "line-color": colors.coast,
        "line-width": 1.2,
        "line-opacity": stylisedOpacity(0.9) as never,
      },
    },
  ];
}

/** Keyless fallback. Plain, but it proves the zoom without an account. */
export function buildOsmStyle(
  colors: GlobeColors,
  land: GeoJSON.GeoJsonObject,
): StyleSpecification {
  return {
    version: 8,
    sources: {
      land: { type: "geojson", data: land as never },
      grid: { type: "geojson", data: graticule() as never },
      real: {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        maxzoom: 19,
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      },
    },
    layers: [
      // Real map underneath. minzoom is about money, not looks: without it
      // MapLibre fetches tiles it's drawing at zero opacity, so idly spinning
      // the globe would burn request quota for nothing visible.
      {
        id: "real-tiles",
        type: "raster",
        source: "real",
        minzoom: REAL_MINZOOM,
        paint: { "raster-opacity": realOpacity() as never },
      },
      ...stylisedLayers(colors),
    ],
  };
}

/**
 * Take MapTiler's own vector style and put the stylised sphere on top of it.
 *
 * Why not raster? MapTiler's raster tiles are a paid feature — the free tier
 * serves vector. So we fetch their style.json and layer over it rather than
 * requesting .png tiles that would 403.
 *
 * Pure: the caller does the fetching, this does the merging.
 */
export function mergeMapTilerStyle(
  base: StyleSpecification,
  colors: GlobeColors,
  land: GeoJSON.GeoJsonObject,
): StyleSpecification {
  const merged: StyleSpecification = {
    ...base,
    sources: {
      ...base.sources,
      land: { type: "geojson", data: land as never },
      grid: { type: "geojson", data: graticule() as never },
    },
    // Their whole style, held back until the descent, then ours on top fading out.
    layers: [
      ...base.layers.map((l) => ({
        ...l,
        minzoom: Math.max(l.minzoom ?? 0, REAL_MINZOOM),
      })),
      ...stylisedLayers(colors),
    ],
  };
  return merged;
}

/** The style.json to fetch. Vector, and free-tier eligible. */
export function maptilerStyleUrl(key: string, dark: boolean): string {
  const mapId = dark ? "streets-v2-dark" : "streets-v2";
  return `https://api.maptiler.com/maps/${mapId}/style.json?key=${key}`;
}
