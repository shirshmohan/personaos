/**
 * Where the globe is looking, published for anything that has to move with it.
 *
 * The star field is a page-level canvas and the map is a lazily-loaded island
 * inside it — they never share a parent, so the camera can't come down as a
 * prop. This is deliberately not React state: it updates every animation frame
 * while the globe spins, and routing that through a re-render would drop frames
 * for no benefit. Subscribers draw to canvas; nothing here touches the DOM.
 */
export interface GlobeCamera {
  /** Centre longitude, degrees. */
  lng: number;
  /** Map bearing, degrees. */
  bearing: number;
}

let camera: GlobeCamera = { lng: 0, bearing: 0 };
const subscribers = new Set<(c: GlobeCamera) => void>();

export function setGlobeCamera(next: GlobeCamera): void {
  camera = next;
  for (const fn of subscribers) fn(next);
}

export function getGlobeCamera(): GlobeCamera {
  return camera;
}

export function subscribeGlobeCamera(fn: (c: GlobeCamera) => void): () => void {
  subscribers.add(fn);
  fn(camera);
  return () => {
    subscribers.delete(fn);
  };
}
