import type { TravelPhoto } from "./photos";

/**
 * Photos grouped into trips, for the cards that float around the globe.
 *
 * The pins are per-photo — that's the whole point of per-photo GPS. But a card
 * reading "Kyoto · 1 photo" fourteen times is noise, so the cards work at the
 * level above: one per trip, anchored at the middle of that trip's photos.
 *
 * Pure, so the anchor maths is testable. A card that floats over the wrong
 * ocean is not something to discover by eye.
 */
export interface Trip {
  slug: string;
  title: string;
  city: string | null;
  country: string | null;
  photoCount: number;
  /** Where the card sits: the centre of this trip's photos. */
  lat: number;
  lng: number;
  /** The first photo, as the card's thumbnail. */
  thumbUrl: string;
}

/**
 * Average a set of longitudes correctly.
 *
 * Naive averaging breaks across the antimeridian: photos at +179 and -179 are
 * two degrees apart but average to 0 — the middle of Africa. So average the
 * unit vectors instead, which has no seam.
 */
export function meanLngLat(
  points: readonly { lat: number; lng: number }[],
): { lat: number; lng: number } {
  let x = 0;
  let y = 0;
  let z = 0;
  for (const p of points) {
    const lat = (p.lat * Math.PI) / 180;
    const lng = (p.lng * Math.PI) / 180;
    x += Math.cos(lat) * Math.cos(lng);
    y += Math.cos(lat) * Math.sin(lng);
    z += Math.sin(lat);
  }
  const n = points.length || 1;
  x /= n;
  y /= n;
  z /= n;

  const hyp = Math.sqrt(x * x + y * y);
  return {
    lat: (Math.atan2(z, hyp) * 180) / Math.PI,
    lng: (Math.atan2(y, x) * 180) / Math.PI,
  };
}

/** Group located photos into one card per trip, biggest first. */
export function groupIntoTrips(photos: readonly TravelPhoto[]): Trip[] {
  const byTrip = new Map<string, TravelPhoto[]>();
  for (const p of photos) {
    const list = byTrip.get(p.entrySlug) ?? [];
    list.push(p);
    byTrip.set(p.entrySlug, list);
  }

  const trips: Trip[] = [];
  for (const [slug, list] of byTrip) {
    const centre = meanLngLat(list);
    trips.push({
      slug,
      title: list[0].entryTitle,
      city: list[0].city,
      country: list[0].country,
      photoCount: list.length,
      lat: centre.lat,
      lng: centre.lng,
      thumbUrl: list[0].url,
    });
  }
  // Busiest trips first, so if we ever cap the card count we keep the best ones.
  return trips.sort((a, b) => b.photoCount - a.photoCount);
}
