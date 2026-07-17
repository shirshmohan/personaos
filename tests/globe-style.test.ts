import { describe, expect, it } from "vitest";
import {
  buildOsmStyle,
  mergeMapTilerStyle,
  maptilerStyleUrl,
  stylisedLayers,
  graticule,
  stylisedOpacity,
  realOpacity,
  GLOBE_COLORS,
  FADE_START,
  FADE_END,
  REAL_MINZOOM,
} from "@/features/travel/globe-style";
import type { StyleSpecification } from "maplibre-gl";

const land = { type: "FeatureCollection", features: [] } as never;

/** Evaluate a MapLibre linear interpolate expression at a given zoom. */
function evalInterp(expr: unknown, zoom: number): number {
  const e = expr as [string, unknown, unknown, number, number, number, number];
  const [z1, v1, z2, v2] = [e[3], e[4], e[5], e[6]];
  if (zoom <= z1) return v1;
  if (zoom >= z2) return v2;
  return v1 + ((zoom - z1) / (z2 - z1)) * (v2 - v1);
}

describe("the crossfade — stylised out, real in", () => {
  it("shows ONLY the stylised sphere from space", () => {
    expect(evalInterp(stylisedOpacity(1), 0)).toBe(1);
    expect(evalInterp(realOpacity(), 0)).toBe(0);
  });

  it("shows ONLY the real map up close", () => {
    expect(evalInterp(stylisedOpacity(1), 10)).toBe(0);
    expect(evalInterp(realOpacity(), 10)).toBe(1);
  });

  it("never dips to an empty screen mid-fade", () => {
    // The fades must be complementary at every step, or the globe blinks.
    for (let z = FADE_START; z <= FADE_END; z += 0.25) {
      const total =
        evalInterp(stylisedOpacity(1), z) + evalInterp(realOpacity(), z);
      expect(total).toBeCloseTo(1, 5);
    }
  });
});

describe("buildOsmStyle (keyless fallback)", () => {
  it("puts the stylised sphere ON TOP of the real map", () => {
    const s = buildOsmStyle(GLOBE_COLORS.dark, land);
    const ids = s.layers.map((l) => l.id);
    expect(ids[0]).toBe("real-tiles");
    expect(ids.slice(1)).toEqual([
      "globe-water",
      "globe-land",
      "globe-grid",
      "globe-coast",
    ]);
  });

  it("does not request tiles at world zoom (protects the quota)", () => {
    const s = buildOsmStyle(GLOBE_COLORS.dark, land);
    const real = s.layers.find((l) => l.id === "real-tiles");
    expect(real?.minzoom).toBe(REAL_MINZOOM);
    expect(REAL_MINZOOM).toBeLessThan(FADE_START);
  });

  it("carries the theme's colours through", () => {
    const s = buildOsmStyle(GLOBE_COLORS.light, land);
    expect(JSON.stringify(s.layers)).toContain(GLOBE_COLORS.light.water);
  });
});

describe("mergeMapTilerStyle — imagery IS the globe now", () => {
  const base = {
    version: 8,
    sources: { satellite: { type: "raster", url: "https://x/tiles.json" } },
    layers: [
      { id: "bg", type: "background", paint: {} },
      { id: "imagery", type: "raster", source: "satellite" },
      { id: "roads", type: "line", source: "openmaptiles", minzoom: 8 },
    ],
  } as unknown as StyleSpecification;

  it("does NOT paint a stylised sphere over real imagery", () => {
    const s = mergeMapTilerStyle(base, GLOBE_COLORS.dark, land);
    const ids = s.layers.map((l) => l.id);
    expect(ids).toEqual(["bg", "imagery", "roads"]);
    expect(ids.some((id) => id.startsWith("globe-"))).toBe(false);
  });

  it("puts no grid on the planet — Earth has no lines drawn on it", () => {
    const s = mergeMapTilerStyle(base, GLOBE_COLORS.dark, land);
    expect(Object.keys(s.sources)).not.toContain("grid");
  });

  it("does not hold the imagery back — it has to be there from frame one", () => {
    // The opposite of the old vector behaviour: withholding tiles until zoom 3
    // would leave a black hole where the planet should be.
    const s = mergeMapTilerStyle(base, GLOBE_COLORS.dark, land);
    const imagery = s.layers.find((l) => l.id === "imagery");
    expect(imagery?.minzoom).toBeUndefined();
  });

  it("keeps our sky, because MapTiler styles a map and not the void around it", () => {
    const s = mergeMapTilerStyle(base, GLOBE_COLORS.dark, land);
    expect(s.sky).toBeDefined();
    expect(JSON.stringify(s.sky)).toContain(GLOBE_COLORS.dark.space);
  });
});

describe("maptilerStyleUrl", () => {
  it("asks for hybrid — satellite imagery you can still navigate", () => {
    expect(maptilerStyleUrl("abc123", true)).toContain("/maps/hybrid/");
  });

  it("requests a style, never raster tiles directly (raster .png is paid)", () => {
    const url = maptilerStyleUrl("abc123", true);
    expect(url).toContain("style.json");
    expect(url).not.toContain(".png");
    expect(url).toContain("key=abc123");
  });

  it("has no dark variant, because a photograph has no dark variant", () => {
    expect(maptilerStyleUrl("k", true)).toBe(maptilerStyleUrl("k", false));
  });
});

describe("graticule", () => {
  it("draws meridians and parallels", () => {
    const g = graticule(20);
    expect(g.features.length).toBeGreaterThan(20);
    for (const f of g.features) expect(f.geometry.type).toBe("LineString");
  });
});

describe("stylisedLayers", () => {
  it("every layer fades out — none is left covering the map at street level", () => {
    for (const l of stylisedLayers(GLOBE_COLORS.dark)) {
      expect(JSON.stringify(l.paint)).toContain("interpolate");
    }
  });
});
