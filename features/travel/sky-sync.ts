/**
 * The one number the starfield needs from the globe.
 *
 * In Google Earth the sky moves when the planet does — that's most of what
 * makes it feel like you're in orbit rather than looking at a picture. Our
 * stars are a 2D canvas behind a WebGL map, so they can't know about the camera
 * unless something tells them.
 *
 * A module-level object rather than context or state: this is read every single
 * animation frame, and re-rendering React 60 times a second to move some dots
 * would be absurd. Both sides just touch the same mutable object.
 */
export const skyState = {
  /** The globe's centre longitude. Stars offset against this. */
  lng: 0,
  /** How far in we are — stars fade out as the ground arrives. */
  zoom: 0,
};
