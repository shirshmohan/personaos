import { describe, expect, it } from "vitest";
import {
  latLngToVec3, greatCircleArc, length, angleBetween, faceRotation,
} from "@/features/travel/globe-math";

const R = 100;
const close = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) < eps;

describe("latLngToVec3 — pins must land ON the sphere", () => {
  it("puts every point exactly on the surface", () => {
    const places: [number, number][] = [
      [19.076, 72.8777],   // Mumbai
      [-33.8688, 151.2093],// Sydney
      [40.7128, -74.006],  // New York
      [0, 0], [90, 0], [-90, 0], [0, 180], [0, -180],
    ];
    for (const [lat, lng] of places) {
      expect(close(length(latLngToVec3(lat, lng, R)), R, 1e-9)).toBe(true);
    }
  });

  it("puts the north pole at the top (+Y) and the south at the bottom", () => {
    expect(close(latLngToVec3(90, 0, R).y, R)).toBe(true);
    expect(close(latLngToVec3(-90, 0, R).y, -R)).toBe(true);
  });

  it("puts the equator at y=0", () => {
    for (const lng of [-180, -90, 0, 90, 180]) {
      expect(close(latLngToVec3(0, lng, R).y, 0)).toBe(true);
    }
  });

  it("separates northern and southern hemispheres correctly", () => {
    expect(latLngToVec3(19.076, 72.8777, R).y).toBeGreaterThan(0);  // Mumbai N
    expect(latLngToVec3(-33.8688, 151.2093, R).y).toBeLessThan(0);  // Sydney S
  });

  it("keeps real-world distances sane (Mumbai->Sydney is a long way)", () => {
    const mumbai = latLngToVec3(19.076, 72.8777, R);
    const sydney = latLngToVec3(-33.8688, 151.2093, R);
    // ~10,150 km on a 6371km-radius earth ≈ 1.59 rad
    const rad = angleBetween(mumbai, sydney);
    const km = rad * 6371;
    expect(km).toBeGreaterThan(9500);
    expect(km).toBeLessThan(11000);
  });

  it("puts antipodal points opposite each other (pi apart)", () => {
    const a = latLngToVec3(19.076, 72.8777, R);
    const b = latLngToVec3(-19.076, 72.8777 - 180, R);
    expect(close(angleBetween(a, b), Math.PI, 1e-6)).toBe(true);
  });
});

describe("greatCircleArc — routes must connect the pins, not cut through the earth", () => {
  const a = latLngToVec3(19.076, 72.8777, R);
  const b = latLngToVec3(-33.8688, 151.2093, R);
  const arc = greatCircleArc(a, b, R);

  it("starts and ends exactly on its pins", () => {
    expect(close(arc[0].x, a.x, 1e-6) && close(arc[0].y, a.y, 1e-6)).toBe(true);
    const last = arc[arc.length - 1];
    expect(close(last.x, b.x, 1e-6) && close(last.y, b.y, 1e-6)).toBe(true);
  });

  it("never dips inside the sphere (would be buried/invisible)", () => {
    for (const p of arc) expect(length(p)).toBeGreaterThanOrEqual(R - 1e-6);
  });

  it("bulges outward in the middle", () => {
    expect(length(arc[Math.floor(arc.length / 2)])).toBeGreaterThan(R);
  });

  it("degenerates safely for two photos at the same spot", () => {
    const p = latLngToVec3(19.076, 72.8777, R);
    expect(greatCircleArc(p, p, R)).toHaveLength(2);
  });

  it("bulges MORE for longer routes than for neighbours", () => {
    const near = latLngToVec3(19.08, 72.88, R);
    const shortArc = greatCircleArc(a, near, R);
    const longArc = greatCircleArc(a, b, R);
    const rise = (arc2: typeof shortArc) =>
      length(arc2[Math.floor(arc2.length / 2)]) - R;
    expect(rise(longArc)).toBeGreaterThan(rise(shortArc));
  });
});

describe("faceRotation", () => {
  it("returns finite rotations", () => {
    const r = faceRotation(19.076, 72.8777);
    expect(Number.isFinite(r.x) && Number.isFinite(r.y)).toBe(true);
  });
});
