import exifr from "exifr";

export interface PhotoLocation {
  lat: number;
  lng: number;
}

/**
 * Read GPS from a photo File — CLIENT-SIDE, before it uploads to Cloudinary
 * (which strips EXIF). iPhone/most cameras embed lat/lng in the original; this
 * captures it at file-select so the stripped Cloudinary copy doesn't matter.
 *
 * Returns null when the photo has no GPS (screenshots, edited, downloaded,
 * already-stripped) — the caller falls back to the city picker.
 */
export async function extractPhotoLocation(file: File): Promise<PhotoLocation | null> {
  try {
    const gps = await exifr.gps(file);
    if (gps && typeof gps.latitude === "number" && typeof gps.longitude === "number") {
      return { lat: gps.latitude, lng: gps.longitude };
    }
    return null;
  } catch {
    return null; // unreadable / unsupported format — fall back gracefully
  }
}
