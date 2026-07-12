import { notFound } from "next/navigation";
import { getPublished, getRelatedBySlug } from "@/features/entities/public";
import { BlockRenderer } from "@/components/public/block-renderer";
import { Related } from "@/components/public/related";
import { MiniAtlas } from "@/components/public/mini-atlas";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = await getPublished("travel", slug);
  if (!e) return { title: "Not found" };
  return { title: e.title, description: e.summary ?? undefined,
    openGraph: e.cover ? { images: [{ url: e.cover.url }] } : undefined };
}

export default async function Detail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = await getPublished("travel", slug);
  if (!e) notFound();
  const related = await getRelatedBySlug("travel", slug);
  return (
    <article className="mx-auto max-w-3xl py-(--spacing-section)">
      {e.cover ? (
        <div className="mb-8 overflow-hidden rounded-xl border border-(--color-hairline)">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={e.cover.url} alt={e.cover.alt} className="w-full" />
        </div>
      ) : null}
      <h1 className="max-w-3xl font-(family-name:--font-display) text-[length:var(--text-title)] leading-tight tracking-tight text-balance">{e.title}</h1>
      {e.summary ? (
        <p className="mt-4 max-w-prose text-lg leading-relaxed text-(--color-ink-muted) text-pretty">{e.summary}</p>
      ) : null}
      <div className="mt-8"><BlockRenderer blocks={e.body} /></div>
      <MiniAtlas type="travel" slug={slug} />
      <Related items={related} />
    </article>
  );
}
