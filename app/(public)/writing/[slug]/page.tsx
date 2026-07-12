import { notFound } from "next/navigation";
import { getPublished, getRelatedBySlug } from "@/features/entities/public";
import { BlockRenderer } from "@/components/public/block-renderer";
import { Related } from "@/components/public/related";
import { MiniAtlas } from "@/components/public/mini-atlas";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPublished("writing", slug);
  if (!post) return { title: "Not found" };
  return {
    title: post.title,
    description: post.summary ?? undefined,
    openGraph: post.cover
      ? { images: [{ url: post.cover.url }] }
      : undefined,
  };
}

export default async function WritingArticle({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPublished("writing", slug);
  if (!post) notFound();

  const related = await getRelatedBySlug("writing", slug);
  const subtitle =
    typeof post.metadata.subtitle === "string" ? post.metadata.subtitle : null;

  return (
    <article className="mx-auto max-w-3xl py-(--spacing-section)">
      <header className="mb-12">
        <h1 className="max-w-3xl font-(family-name:--font-display) text-[length:var(--text-title)] leading-[1.1] tracking-tight text-balance">
          {post.title}
        </h1>
        {subtitle ? (
          <p className="mt-3 max-w-prose text-lg text-(--color-ink-muted)">
            {subtitle}
          </p>
        ) : null}
        {post.summary ? (
          <p className="mt-6 max-w-prose text-base leading-relaxed text-(--color-ink-muted) text-pretty">
            {post.summary}
          </p>
        ) : null}
      </header>

      <BlockRenderer blocks={post.body} />
      <MiniAtlas type="writing" slug={slug} />
      <Related items={related} />
    </article>
  );
}
