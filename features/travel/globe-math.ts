/**
 * Pure globe maths. Extracted so it can be PROVEN without a browser — this is
 * the part that decides whether every pin lands on the right continent or in
 * the sea, and it's the one part of a 3D globe that's testable headlessly.
 *
 * Convention: Y is up (north pole at +Y), matching three.js's default camera.
 */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

const DEG = Math.PI / 180;

/**
 * Geographic coordinates -> a point on the sphere's surface.
 *
 * phi   = polar angle measured from the north pole (0 at +Y, PI at -Y)
 * theta = azimuth around the Y axis
 */
export function latLngToVec3(lat: number, lng: number, radius: number): Vec3 {
  const phi = (90 - lat) * DEG;
  const theta = (lng + 180) * DEG;
  return {
    x: -radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta),
  };
}

export function length(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

export function normalize(v: Vec3): Vec3 {
  const l = length(v) || 1;
  return { x: v.x / l, y: v.y / l, z: v.z / l };
}

export function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/** Angle between two surface points, in radians. */
export function angleBetween(a: Vec3, b: Vec3): number {
  const d = dot(normalize(a), normalize(b));
  // Guard the acos domain — floating point drifts past ±1.
  return Math.acos(Math.min(1, Math.max(-1, d)));
}

/**
 * A great-circle arc between two surface points, bulging AWAY from the sphere
 * so the line is visible rather than buried inside it. Uses spherical linear
 * interpolation, then lifts the middle.
 *
 * `lift` is the extra radius at the arc's midpoint, as a fraction of `radius`.
 * Longer routes bulge more, which reads as distance.
 */
export function greatCircleArc(
  a: Vec3,
  b: Vec3,
  radius: number,
  segments = 48,
  lift = 0.25,
): Vec3[] {
  const omega = angleBetween(a, b);

  // Coincident (or near) points have no arc — a straight dot, not a line.
  if (omega < 1e-6) return [a, b];

  const sinOmega = Math.sin(omega);
  const na = normalize(a);
  const nb = normalize(b);

  // Bulge scales with how far apart the points are: neighbours stay flat,
  // continents apart get a real curve.
  const maxLift = radius * lift * (omega / Math.PI);

  const points: Vec3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const w1 = Math.sin((1 - t) * omega) / sinOmega;
    const w2 = Math.sin(t * omega) / sinOmega;

    const dir = normalize({
      x: na.x * w1 + nb.x * w2,
      y: na.y * w1 + nb.y * w2,
      z: na.z * w1 + nb.z * w2,
    });

    // sin(pi*t) is 0 at both ends and 1 at the middle — so the arc starts and
    // finishes exactly on its pins, and only rises in between.
    const r = radius + maxLift * Math.sin(Math.PI * t);
    points.push({ x: dir.x * r, y: dir.y * r, z: dir.z * r });
  }
  return points;
}

/**
 * The rotation that brings a given lat/lng to face the camera (+Z). Used to
 * open the globe on the place with the most photos rather than on the Pacific.
 */
export function faceRotation(lat: number, lng: number): { x: number; y: number } {
  return {
    x: lat * DEG,
    y: -(lng + 180) * DEG - Math.PI / 2,
  };
}

/* -------------------------------------------------------------------------- */
/* Coastlines                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * A closed ring of [lng, lat] pairs — the order GeoJSON stores coastlines in.
 * Note the reversal: GeoJSON is lng-first, our projection is lat-first. Getting
 * that backwards silently puts India in the ocean, so it's done in one place.
 */
export type LngLatRing = readonly (readonly [number, number])[];

/**
 * Coastline rings -> a flat vertex list for a single THREE.LineSegments.
 *
 * The whole world is ~126 rings / ~5k points. Drawn as one merged geometry
 * that's one draw call, rather than 126 Line objects (D39: lots of motion,
 * never at the cost of speed).
 *
 * LineSegments consumes vertex PAIRS, so each ring of N points yields N-1
 * segments = (N-1)*2 vertices = (N-1)*6 numbers.
 */
export function ringsToSegmentPositions(
  rings: readonly LngLatRing[],
  radius: number,
): number[] {
  const out: number[] = [];
  for (const ring of rings) {
    for (let i = 0; i < ring.length - 1; i++) {
      const [lngA, latA] = ring[i];
      const [lngB, latB] = ring[i + 1];
      const a = latLngToVec3(latA, lngA, radius);
      const b = latLngToVec3(latB, lngB, radius);
      out.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
  }
  return out;
}
