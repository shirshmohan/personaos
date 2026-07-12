import { notFound } from "next/navigation";
import { getPublished, getRelatedBySlug } from "@/features/entities/public";
import { BlockRenderer } from "@/components/public/block-renderer";
import { Related } from "@/components/public/related";
import { MiniAtlas } from "@/components/public/mini-atlas";
import { tierStyle } from "@/features/entities/tiers";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await getPublished("library", slug);
  if (!item) return { title: "Not found" };
  return {
    title: item.title,
    description: item.summary ?? undefined,
    openGraph: item.cover ? { images: [{ url: item.cover.url }] } : undefined,
  };
}

export default async function LibraryDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await getPublished("library", slug);
  if (!item) notFound();

  const related = await getRelatedBySlug("library", slug);
  const meta = item.metadata;
  const tier = typeof meta.tier === "string" ? meta.tier : null;
  const category = typeof meta.category === "string" ? meta.category : null;
  const author = typeof meta.author === "string" ? meta.author : null;
  const genres = Array.isArray(meta.genre) ? (meta.genre as string[]) : [];

  return (
    <article className="mx-auto max-w-3xl py-(--spacing-section)">
      <div className="flex flex-col gap-8 sm:flex-row sm:gap-12">
        {item.cover ? (
          <div className="sm:w-56 sm:shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.cover.url}
              alt={item.cover.alt}
              className="w-full rounded-lg border border-(--color-hairline)"
            />
          </div>
        ) : null}

        <div className="flex-1">
          <div className="mb-2 flex items-center gap-3">
            {tier ? (
              <span
                className="font-(family-name:--font-display) text-6xl leading-none"
                style={{ color: tierStyle(tier)?.color ?? "var(--color-ink)" }}
              >
                {tier}
              </span>
            ) : null}
            {category ? (
              <span className="font-(family-name:--font-mono) text-xs tracking-widest text-(--color-ink-muted) uppercase">
                {category}
              </span>
            ) : null}
          </div>
          <h1 className="font-(family-name:--font-display) text-[length:var(--text-title)] leading-tight tracking-tight text-balance">
            {item.title}
          </h1>
          {author ? (
            <p className="mt-1 text-sm text-(--color-ink-muted)">{author}</p>
          ) : null}
          {genres.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {genres.map((g) => (
                <li
                  key={g}
                  className="rounded-md border border-(--color-hairline) px-2 py-0.5 text-xs text-(--color-ink-muted)"
                >
                  {g}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      {item.summary ? (
        <p className="mt-10 max-w-prose text-lg leading-relaxed text-pretty">
          {item.summary}
        </p>
      ) : null}

      <div className="mt-8">
        <BlockRenderer blocks={item.body} />
      </div>

      <MiniAtlas type="library" slug={slug} />
      <Related items={related} />
    </article>
  );
}
