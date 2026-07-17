import { describe, expect, it } from "vitest";
import {
  ringsToSegmentPositions,
  latLngToVec3,
  length,
  type LngLatRing,
} from "@/features/travel/globe-math";

const R = 100;

describe("ringsToSegmentPositions", () => {
  it("turns a ring of N points into N-1 segments", () => {
    const ring: LngLatRing = [[0, 0], [10, 0], [10, 10]];
    const pos = ringsToSegmentPositions([ring], R);
    expect(pos).toHaveLength(2 * 6); // 2 segments * 2 vertices * 3 numbers
  });

  it("puts every coastline vertex ON the sphere", () => {
    const ring: LngLatRing = [[0, 0], [90, 45], [180, -30], [-90, 60]];
    const pos = ringsToSegmentPositions([ring], R);
    for (let i = 0; i < pos.length; i += 3) {
      const r = length({ x: pos[i], y: pos[i + 1], z: pos[i + 2] });
      expect(r).toBeCloseTo(R, 6);
    }
  });

  it("reads GeoJSON lng-first (India must not land in the ocean)", () => {
    // GeoJSON gives [lng, lat]; our projection takes (lat, lng).
    const india: LngLatRing = [[77, 20], [78, 21]];
    const pos = ringsToSegmentPositions([india], R);
    const expected = latLngToVec3(20, 77, R); // lat 20, lng 77
    expect(pos[0]).toBeCloseTo(expected.x, 6);
    expect(pos[1]).toBeCloseTo(expected.y, 6);
    expect(pos[2]).toBeCloseTo(expected.z, 6);
  });

  it("handles many rings and empty input", () => {
    expect(ringsToSegmentPositions([], R)).toEqual([]);
    expect(ringsToSegmentPositions([[[0, 0]]], R)).toEqual([]); // 1 point = no segment
    const two = ringsToSegmentPositions([[[0, 0], [1, 1]], [[2, 2], [3, 3]]], R);
    expect(two).toHaveLength(2 * 6);
  });
});
