import { describe, expect, it } from "vitest";
import { parseCoords, isValidCoords } from "@/features/entities/coords";

describe("parseCoords — what's actually on your clipboard", () => {
  it("parses Google Maps 'copy coordinates' output", () => {
    expect(parseCoords("19.0760, 72.8777")).toEqual({ lat: 19.076, lng: 72.8777 });
  });
  it("parses without a space", () => {
    expect(parseCoords("19.0760,72.8777")).toEqual({ lat: 19.076, lng: 72.8777 });
  });
  it("parses a Google Maps URL (@lat,lng)", () => {
    expect(parseCoords("https://www.google.com/maps/@19.0760,72.8777,17z")).toEqual({
      lat: 19.076, lng: 72.8777,
    });
  });
  it("parses a q= query URL", () => {
    expect(parseCoords("https://maps.app.goo.gl/x?q=19.0760,72.8777")).toEqual({
      lat: 19.076, lng: 72.8777,
    });
  });
  it("handles negative coordinates (western/southern hemispheres)", () => {
    expect(parseCoords("-33.8688, 151.2093")).toEqual({ lat: -33.8688, lng: 151.2093 });
  });
  it("rejects off-planet coordinates", () => {
    expect(parseCoords("91, 0")).toBeNull();      // lat > 90
    expect(parseCoords("0, 181")).toBeNull();     // lng > 180
  });
  it("rejects junk", () => {
    expect(parseCoords("")).toBeNull();
    expect(parseCoords("Mumbai")).toBeNull();
    expect(parseCoords("19.0760")).toBeNull();    // only one number
  });
});

describe("isValidCoords", () => {
  it("accepts the edges of the planet", () => {
    expect(isValidCoords(90, 180)).toBe(true);
    expect(isValidCoords(-90, -180)).toBe(true);
  });
  it("rejects NaN", () => {
    expect(isValidCoords(NaN, 0)).toBe(false);
  });
});
