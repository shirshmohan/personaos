import { listPublished } from "@/features/entities/public";
import { getTravelPhotos } from "@/features/travel/photos";
import { CoverGrid } from "@/components/public/cover-grid";
import { GlobeMapLazy } from "@/components/public/globe-map-lazy";

export const dynamic = "force-dynamic";
export const metadata = { title: "Travel" };

export default async function TravelPage() {
  const [items, photos] = await Promise.all([
    listPublished("travel"),
    getTravelPhotos(),
  ]);

  return (
    <div className="mx-auto max-w-5xl py-(--spacing-section)">
      <header className="mb-8">
        <p className="mb-3 font-(family-name:--font-mono) text-xs tracking-widest text-(--color-ink-muted) uppercase">
          Travel
        </p>
        <h1 className="font-(family-name:--font-display) text-[length:var(--text-title)] leading-tight tracking-tight">
          Places been
        </h1>
        <p className="mt-4 max-w-prose text-sm leading-relaxed text-(--color-ink-muted)">
          {photos.length > 0
            ? `${photos.length} photo${photos.length === 1 ? "" : "s"}, each pinned exactly where it was taken. Spin the globe, then keep zooming — it goes all the way to the street.`
            : "Photos appear here as pins once they have coordinates."}
        </p>
      </header>

      {/* Stylised from space, real streets up close — one globe, one library. */}
      <div className="mb-16">
        <GlobeMapLazy photos={photos} />
      </div>

      <div className="mx-auto max-w-3xl">
        {items.length === 0 ? (
          <p className="text-sm text-(--color-ink-muted)">Nothing published yet.</p>
        ) : (
          <CoverGrid items={items} base="/travel" />
        )}
      </div>
    </div>
  );
}
