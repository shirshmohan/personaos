import { describe, expect, it } from "vitest";
import { groupIntoTrips, meanLngLat } from "@/features/travel/trips";
import type { TravelPhoto } from "@/features/travel/photos";

function photo(p: Partial<TravelPhoto>): TravelPhoto {
  return {
    url: "u", alt: "a", lat: 0, lng: 0,
    entrySlug: "t", entryTitle: "T", city: null, country: null,
    ...p,
  };
}

describe("meanLngLat", () => {
  it("finds the middle of a cluster", () => {
    const c = meanLngLat([{ lat: 19.11, lng: 73.00 }, { lat: 19.13, lng: 73.02 }]);
    expect(c.lat).toBeCloseTo(19.12, 2);
    expect(c.lng).toBeCloseTo(73.01, 2);
  });

  it("does not drop the card in Africa when a trip spans the antimeridian", () => {
    // +179 and -179 are 2 degrees apart. Naive averaging gives 0 — the Atlantic.
    const c = meanLngLat([{ lat: 0, lng: 179 }, { lat: 0, lng: -179 }]);
    expect(Math.abs(c.lng)).toBeCloseTo(180, 1);
    expect(c.lat).toBeCloseTo(0, 5);
  });

  it("survives a single photo unchanged", () => {
    const c = meanLngLat([{ lat: 18.92, lng: 72.83 }]);
    expect(c.lat).toBeCloseTo(18.92, 4);
    expect(c.lng).toBeCloseTo(72.83, 4);
  });

  it("does not divide by zero on an empty set", () => {
    expect(() => meanLngLat([])).not.toThrow();
  });
});

describe("groupIntoTrips", () => {
  const photos = [
    photo({ entrySlug: "rcp", entryTitle: "RCP", lat: 19.118, lng: 73.008, url: "a.jpg", city: "Ghansoli" }),
    photo({ entrySlug: "rcp", entryTitle: "RCP", lat: 19.120, lng: 73.012, url: "b.jpg", city: "Ghansoli" }),
    photo({ entrySlug: "rcp", entryTitle: "RCP", lat: 19.116, lng: 73.010, url: "c.jpg", city: "Ghansoli" }),
    photo({ entrySlug: "mumbai", entryTitle: "Mumbai", lat: 18.92, lng: 72.83, url: "d.jpg", city: "Mumbai" }),
  ];

  it("makes one card per trip, not one per photo", () => {
    const trips = groupIntoTrips(photos);
    expect(trips).toHaveLength(2);
  });

  it("counts the photos behind each card", () => {
    const trips = groupIntoTrips(photos);
    expect(trips[0].photoCount).toBe(3); // RCP
    expect(trips[1].photoCount).toBe(1); // Mumbai
  });

  it("anchors the card in the middle of its own photos", () => {
    const rcp = groupIntoTrips(photos)[0];
    expect(rcp.lat).toBeCloseTo(19.118, 2);
    expect(rcp.lng).toBeCloseTo(73.010, 2);
  });

  it("puts the busiest trip first", () => {
    expect(groupIntoTrips(photos)[0].slug).toBe("rcp");
  });

  it("carries a thumbnail and the place through", () => {
    const rcp = groupIntoTrips(photos)[0];
    expect(rcp.thumbUrl).toBe("a.jpg");
    expect(rcp.city).toBe("Ghansoli");
    expect(rcp.title).toBe("RCP");
  });

  it("returns nothing for no photos", () => {
    expect(groupIntoTrips([])).toEqual([]);
  });
});
