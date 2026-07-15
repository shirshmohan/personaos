import { notFound } from "next/navigation";
import { getPublished, getRelatedBySlug } from "@/features/entities/public";
import { getPatternProblems } from "@/features/train/public";
import { BlockRenderer } from "@/components/public/block-renderer";
import { MiniAtlas } from "@/components/public/mini-atlas";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const e = await getPublished("train", slug);
  return { title: e?.title ?? "Pattern" };
}

const diffColor: Record<string, string> = {
  Easy: "text-green-500", Medium: "text-amber-500", Hard: "text-red-500",
};

export default async function PatternPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pattern = await getPublished("train", slug);
  if (!pattern) notFound();
  const problems = await getPatternProblems(slug);

  return (
    <article className="mx-auto max-w-3xl py-(--spacing-section)">
      <p className="mb-3 font-(family-name:--font-mono) text-xs tracking-widest text-(--color-ink-muted) uppercase">Pattern</p>
      <h1 className="font-(family-name:--font-display) text-[length:var(--text-title)] leading-tight tracking-tight text-balance">
        {pattern.title}
      </h1>
      {pattern.summary ? (
        <p className="mt-4 max-w-prose text-lg leading-relaxed text-(--color-ink-muted) text-pretty">{pattern.summary}</p>
      ) : null}

      {pattern.body.length > 0 ? (
        <div className="mt-8"><BlockRenderer blocks={pattern.body} /></div>
      ) : (
        <p className="mt-8 rounded-lg border border-dashed border-(--color-border) px-5 py-6 text-sm text-(--color-ink-muted)">
          No write-up yet — the problems below are filed under this pattern.
        </p>
      )}

      {/* The problems */}
      <section className="mt-12">
        <h2 className="mb-4 font-(family-name:--font-mono) text-xs tracking-widest text-(--color-ink-muted) uppercase">
          Problems ({problems.length})
        </h2>
        {problems.length === 0 ? (
          <p className="text-sm text-(--color-ink-muted)">None filed here yet.</p>
        ) : (
          <ul className="divide-y divide-(--color-hairline)">
            {problems.map((p) => (
              <li key={p.url} className="flex items-baseline gap-3 py-2.5">
                {p.important ? <span className="text-amber-500">★</span> : null}
                <a href={p.url} target="_blank" rel="noreferrer" className="flex-1 truncate text-sm hover:underline">
                  {p.title}
                </a>
                {p.companies.length > 0 ? (
                  <span className="hidden gap-1 sm:flex">
                    {p.companies.slice(0, 3).map((c) => (
                      <span key={c} className="rounded border border-(--color-hairline) px-1.5 py-0.5 text-xs text-(--color-ink-muted)">{c}</span>
                    ))}
                  </span>
                ) : null}
                {p.comment ? (
                  <span className="hidden max-w-[10rem] truncate text-xs text-(--color-ink-muted) md:inline">{p.comment}</span>
                ) : null}
                <span className={cn("text-xs", diffColor[p.difficulty])}>{p.difficulty}</span>
                {p.myRating ? <span className="font-(family-name:--font-mono) text-xs text-(--color-ink-muted) tabular-nums">{p.myRating}/5</span> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Connected patterns graph */}
      <MiniAtlas type="train" slug={slug} />
    </article>
  );
}
