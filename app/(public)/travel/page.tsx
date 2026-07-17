import Link from "next/link";
import { listPublished } from "@/features/entities/public";
import { getTravelPhotos } from "@/features/travel/photos";
import { GlobeMapLazy } from "@/components/public/globe-map-lazy";
import { SpacePage } from "@/components/public/space-page";
import { Reveal } from "@/components/public/reveal";

export const dynamic = "force-dynamic";
export const metadata = { title: "Travel" };

export default async function TravelPage() {
  const [items, photos] = await Promise.all([
    listPublished("travel"),
    getTravelPhotos(),
  ]);

  return (
    <>
      {/* The whole page is space, not a globe in a box on a navy rectangle. */}
      <SpacePage />

      <div className="relative z-10 mx-auto max-w-5xl py-(--spacing-section)">
        <header className="mb-6 text-center">
          <p className="mb-3 font-(family-name:--font-mono) text-xs tracking-widest text-(--color-ink-muted) uppercase">
            Travel
          </p>
          <h1 className="font-(family-name:--font-display) text-[length:var(--text-title)] leading-tight tracking-tight">
            Places been
          </h1>
          <p className="mx-auto mt-4 max-w-prose text-sm leading-relaxed text-(--color-ink-muted)">
            {photos.length > 0
              ? `${photos.length} photo${photos.length === 1 ? "" : "s"}, each pinned exactly where it was taken. Spin the globe, then keep zooming — it goes all the way to the street.`
              : "Photos appear here as pins once they have coordinates."}
          </p>
        </header>

        {/* Full-bleed: the globe should sit in the page's space, not in a panel. */}
        <div className="mb-20 -mx-[calc(50vw-50%)]">
          <GlobeMapLazy photos={photos} />
        </div>

        {items.length === 0 ? (
          <p className="text-center text-sm text-(--color-ink-muted)">
            Nothing published yet.
          </p>
        ) : (
          <div className="mx-auto max-w-3xl">
            <p className="mb-6 font-(family-name:--font-mono) text-xs tracking-widest text-(--color-ink-muted) uppercase">
              The log
            </p>
            {/* Glass, so the starfield reads through the cards and they feel
                suspended in the same space as the globe rather than stacked on
                top of a picture of it. */}
            <ul className="flex flex-col gap-4">
              {items.map((item, i) => (
                <Reveal key={item.slug} delay={i * 70}>
                  <li>
                    <Link
                      href={`/travel/${item.slug}`}
                      className="group flex items-center gap-4 rounded-2xl border border-(--color-hairline) bg-(--color-surface)/40 p-3 backdrop-blur-md transition-colors duration-300 ease-(--ease-quiet) hover:border-(--color-accent)/40 hover:bg-(--color-surface)/60"
                    >
                      <div className="size-20 shrink-0 overflow-hidden rounded-xl bg-(--color-surface-sunken)">
                        {item.cover ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.cover.url}
                            alt={item.cover.alt}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-500 ease-(--ease-quiet) group-hover:scale-105"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="font-(family-name:--font-display) text-xl tracking-tight transition-transform duration-200 ease-(--ease-quiet) group-hover:translate-x-1">
                          {item.title}
                        </h2>
                        {item.summary ? (
                          <p className="mt-0.5 line-clamp-2 text-sm leading-relaxed text-(--color-ink-muted)">
                            {item.summary}
                          </p>
                        ) : null}
                      </div>
                    </Link>
                  </li>
                </Reveal>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}
