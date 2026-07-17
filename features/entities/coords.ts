/**
 * Pure. Parses a pasted location into coordinates.
 *
 * Lives outside any "use server" file because those may only export async
 * functions (the recurring rule — see signature.ts, tag-parse.ts, exif.ts).
 *
 * Accepts what you'd actually have on the clipboard:
 *   "19.0760, 72.8777"           ← Google Maps right-click → copy coordinates
 *   "19.0760,72.8777"
 *   "19.0760 72.8777"
 *   "https://maps.google.com/…/@19.0760,72.8777,17z"   ← a Maps URL
 *   "https://maps.app.goo.gl/…?q=19.0760,72.8777"
 */
export interface Coords {
  lat: number;
  lng: number;
}

const LAT_MIN = -90;
const LAT_MAX = 90;
const LNG_MIN = -180;
const LNG_MAX = 180;

/** A coordinate pair is only real if it's on the planet. */
export function isValidCoords(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= LAT_MIN &&
    lat <= LAT_MAX &&
    lng >= LNG_MIN &&
    lng <= LNG_MAX
  );
}

export function parseCoords(input: string): Coords | null {
  const text = input.trim();
  if (!text) return null;

  // A Google Maps URL puts the viewport centre after an "@".
  const at = text.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (at) {
    const lat = Number(at[1]);
    const lng = Number(at[2]);
    return isValidCoords(lat, lng) ? { lat, lng } : null;
  }

  // …or a q=/query= parameter.
  const q = text.match(/[?&](?:q|query|ll)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (q) {
    const lat = Number(q[1]);
    const lng = Number(q[2]);
    return isValidCoords(lat, lng) ? { lat, lng } : null;
  }

  // A bare pair: comma- or whitespace-separated.
  const pair = text.match(/^(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?)$/);
  if (pair) {
    const lat = Number(pair[1]);
    const lng = Number(pair[2]);
    return isValidCoords(lat, lng) ? { lat, lng } : null;
  }

  return null;
}
