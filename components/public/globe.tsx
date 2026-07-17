"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as THREE from "three";
import {
  greatCircleArc,
  latLngToVec3,
  ringsToSegmentPositions,
  type LngLatRing,
} from "@/features/travel/globe-math";

import type { TravelPhoto } from "@/features/travel/photos";
import { THEMES } from "@/features/theme/themes";

const RADIUS = 100;

/**
 * Three.js can't read our CSS custom properties (they're oklch, which its colour
 * parser won't take), so the globe carries its own palette and picks the dark or
 * light one from the active theme. Not fully theme-reactive, but never wrong.
 */
/**
 * The only shapes we need out of the world-atlas TopoJSON. Declared locally
 * rather than pulling in @types/geojson + topojson-specification for two
 * imports — the surface we touch is this small.
 */
type Ring = [number, number][];
interface LandGeometry {
  type: string;
  coordinates: unknown;
}
interface LandFeature {
  geometry?: LandGeometry;
}
interface LandCollection {
  features?: LandFeature[];
  geometry?: LandGeometry;
}

const PALETTE = {
  dark: {
    sphere: 0x0d1420,
    grid: 0x27384a,
    coast: 0x5b7d9e,
    pin: 0x7cc4ff,
    arc: 0x7cc4ff,
  },
  light: {
    sphere: 0xe8edf2,
    grid: 0xb9c6d4,
    coast: 0x64809b,
    pin: 0x1f6feb,
    arc: 0x1f6feb,
  },
};

function isDarkTheme(): boolean {
  const id = document.documentElement.dataset.theme;
  return THEMES.find((t) => t.id === id)?.dark ?? false;
}

/**
 * A rotating globe with one pin per photo, at the exact coordinates the photo
 * was taken. Routes arc between them.
 *
 * The projection maths lives in globe-math.ts and is unit-tested — pins landing
 * on the right continent is not something you want to discover by eye.
 *
 * Degrades: prefers-reduced-motion stops the auto-spin (still draggable).
 */
export function Globe({ photos }: { photos: TravelPhoto[] }) {
  const router = useRouter();
  const mountRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<TravelPhoto | null>(null);
  const [mounted, setMounted] = useState(false);

  // Never render the canvas on the server — same hydration lesson as the graphs.
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    const mount = mountRef.current;
    if (!mount || photos.length === 0) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dark = isDarkTheme();
    const colors = dark ? PALETTE.dark : PALETTE.light;

    let width = mount.clientWidth;
    let height = mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 2000);
    camera.position.z = 320;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    // Everything lives in one group so a single rotation moves the whole world.
    const globe = new THREE.Group();
    scene.add(globe);

    // The solid body — slightly smaller than the pins so it occludes the ones
    // on the far side, which is what makes it read as a sphere and not a disc.
    const bodyGeo = new THREE.SphereGeometry(RADIUS * 0.995, 64, 48);
    const bodyMat = new THREE.MeshBasicMaterial({
      color: colors.sphere,
      transparent: true,
      opacity: 0.92,
    });
    globe.add(new THREE.Mesh(bodyGeo, bodyMat));

    // Graticule — the lat/lng grid, now a faint backdrop behind the coastlines
    // rather than the main signal.
    const gridGeo = new THREE.SphereGeometry(RADIUS, 36, 24);
    const gridMat = new THREE.LineBasicMaterial({
      color: colors.grid,
      transparent: true,
      opacity: 0.18,
    });
    globe.add(new THREE.LineSegments(new THREE.WireframeGeometry(gridGeo), gridMat));

    // Real coastlines, so this reads as Earth and you can actually find India.
    // world-atlas ships the outlines AS AN NPM PACKAGE — no texture image, no
    // runtime fetch, nothing to 404. Dynamically imported (~54KB) so it never
    // blocks first paint; the globe is already spinning when land arrives.
    let coast: THREE.LineSegments | null = null;
    let alive = true;
    void (async () => {
      try {
        const [worldMod, topojson] = await Promise.all([
          import("world-atlas/land-110m.json"),
          import("topojson-client"),
        ]);
        if (!alive) return;
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const world: any = (worldMod as any).default ?? worldMod;
        const land = (topojson as any).feature(
          world,
          world.objects.land,
        ) as LandCollection;
        /* eslint-enable @typescript-eslint/no-explicit-any */

        // Flatten every polygon of every feature into a flat list of rings.
        const rings: LngLatRing[] = [];
        const features: LandFeature[] = land.features ?? [land as LandFeature];
        for (const f of features) {
          const g = f.geometry;
          if (!g) continue;
          const polys: Ring[][] =
            g.type === "MultiPolygon"
              ? (g.coordinates as Ring[][])
              : g.type === "Polygon"
                ? [g.coordinates as Ring[]]
                : [];
          for (const poly of polys) for (const ring of poly) rings.push(ring);
        }

        // Lifted a hair off the surface so the sphere doesn't z-fight the lines.
        const positions = ringsToSegmentPositions(rings, RADIUS * 1.003);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute(
          "position",
          new THREE.Float32BufferAttribute(positions, 3),
        );
        coast = new THREE.LineSegments(
          geo,
          new THREE.LineBasicMaterial({
            color: colors.coast,
            transparent: true,
            opacity: 0.85,
          }),
        );
        globe.add(coast);
      } catch {
        // No coastlines is a worse globe, not a broken one — the graticule,
        // pins and routes all still work.
      }
    })();

    // One pin per photo, at its own coordinates.
    const pinGeo = new THREE.SphereGeometry(1.8, 12, 12);
    const pinMat = new THREE.MeshBasicMaterial({ color: colors.pin });
    const pins: THREE.Mesh[] = [];
    for (const photo of photos) {
      const p = latLngToVec3(photo.lat, photo.lng, RADIUS);
      const pin = new THREE.Mesh(pinGeo, pinMat);
      pin.position.set(p.x, p.y, p.z);
      pin.userData.photo = photo;
      globe.add(pin);
      pins.push(pin);

      // A soft halo so a pin is findable against the grid.
      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(3.4, 12, 12),
        new THREE.MeshBasicMaterial({
          color: colors.pin,
          transparent: true,
          opacity: 0.22,
        }),
      );
      halo.position.copy(pin.position);
      globe.add(halo);
    }

    // Routes between consecutive photos — the travel line.
    const arcMat = new THREE.LineBasicMaterial({
      color: colors.arc,
      transparent: true,
      opacity: 0.4,
    });
    for (let i = 0; i < photos.length - 1; i++) {
      const a = latLngToVec3(photos[i].lat, photos[i].lng, RADIUS);
      const b = latLngToVec3(photos[i + 1].lat, photos[i + 1].lng, RADIUS);
      const pts = greatCircleArc(a, b, RADIUS).map(
        (v) => new THREE.Vector3(v.x, v.y, v.z),
      );
      globe.add(
        new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), arcMat),
      );
    }

    // Open facing the photos rather than the empty Pacific.
    const first = photos[0];
    globe.rotation.y = -((first.lng + 180) * Math.PI) / 180 - Math.PI / 2;
    globe.rotation.x = (first.lat * Math.PI) / 180 * 0.6;

    // ---- interaction ---------------------------------------------------
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let spin = reduce ? 0 : 0.0012;
    let hoveredPin: THREE.Mesh | null = null;

    function onPointerDown(e: PointerEvent) {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      renderer.domElement.setPointerCapture(e.pointerId);
    }
    function onPointerUp() {
      dragging = false;
    }
    function onPointerMove(e: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (dragging) {
        globe.rotation.y += (e.clientX - lastX) * 0.005;
        globe.rotation.x += (e.clientY - lastY) * 0.005;
        // Don't let it tumble past the poles.
        globe.rotation.x = Math.max(-1.2, Math.min(1.2, globe.rotation.x));
        lastX = e.clientX;
        lastY = e.clientY;
      }
    }
    function onClick() {
      const photo = hoveredPin?.userData.photo as TravelPhoto | undefined;
      if (photo) router.push(`/travel/${photo.entrySlug}`);
    }

    const el = renderer.domElement;
    el.style.touchAction = "none";
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("click", onClick);

    function onResize() {
      if (!mount) return;
      width = mount.clientWidth;
      height = mount.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }
    window.addEventListener("resize", onResize);

    // ---- loop ----------------------------------------------------------
    let raf = 0;
    const worldPos = new THREE.Vector3();

    function frame() {
      raf = requestAnimationFrame(frame);
      if (!dragging) globe.rotation.y += spin;

      // Pick the pin under the cursor.
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(pins, false)[0];
      const pin = (hit?.object as THREE.Mesh) ?? null;

      if (pin !== hoveredPin) {
        hoveredPin = pin;
        setHovered((pin?.userData.photo as TravelPhoto) ?? null);
        spin = pin || reduce ? 0 : 0.0012; // pause the spin while reading
        el.style.cursor = pin ? "pointer" : "grab";
      }

      // Park the photo card next to its pin, in screen space.
      if (hoveredPin && tipRef.current) {
        worldPos.copy(hoveredPin.position);
        globe.localToWorld(worldPos);
        worldPos.project(camera);
        tipRef.current.style.left = `${(worldPos.x * 0.5 + 0.5) * width}px`;
        tipRef.current.style.top = `${(-worldPos.y * 0.5 + 0.5) * height}px`;
      }

      renderer.render(scene, camera);
    }
    frame();

    return () => {

      alive = false;

      coast?.geometry.dispose();
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("click", onClick);
      // WebGL doesn't garbage-collect itself; leaking a context per navigation
      // will kill the tab after a few visits.
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose?.();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose?.();
      });
      renderer.dispose();
      if (el.parentNode === mount) mount.removeChild(el);
    };
  }, [mounted, photos, router]);

  if (photos.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-(--color-border) px-6 py-16 text-center text-sm text-(--color-ink-muted)">
        No located photos yet. Add coordinates to your travel photos in the
        Studio and they&apos;ll appear here.
      </p>
    );
  }

  return (
    <div className="relative">
      <div
        ref={mountRef}
        className="h-[520px] w-full cursor-grab sm:h-[620px]"
        aria-label={`A globe showing ${photos.length} located photos`}
        role="img"
      />

      {/* The photo, next to its pin. */}
      <div
        ref={tipRef}
        className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[115%]"
        style={{ display: hovered ? "block" : "none" }}
      >
        {hovered ? (
          <figure className="w-44 overflow-hidden rounded-lg border border-(--color-hairline) bg-(--color-surface)/95 shadow-2xl backdrop-blur-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={hovered.url}
              alt={hovered.alt}
              className="aspect-[4/3] w-full object-cover"
            />
            <figcaption className="px-2.5 py-1.5">
              <p className="truncate text-xs font-medium">{hovered.alt}</p>
              <p className="truncate font-(family-name:--font-mono) text-[10px] text-(--color-ink-muted)">
                {[hovered.city, hovered.country].filter(Boolean).join(", ") ||
                  hovered.entryTitle}
              </p>
            </figcaption>
          </figure>
        ) : null}
      </div>
    </div>
  );
}
