import { notFound } from "next/navigation";
import { ArrowUpRight, Github } from "lucide-react";
import { getPublished, getRelatedBySlug } from "@/features/entities/public";
import { BlockRenderer } from "@/components/public/block-renderer";
import { Related } from "@/components/public/related";
import { MiniAtlas } from "@/components/public/mini-atlas";
import { getEntityTags } from "@/features/entities/tags";
import { getPublishedIdBySlug } from "@/features/entities/public";
import { TECH_TAG_PREFIX } from "@/features/entities/tech";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getPublished("projects", slug);
  if (!p) return { title: "Not found" };
  return { title: p.title, description: p.summary ?? undefined,
    openGraph: p.cover ? { images: [{ url: p.cover.url }] } : undefined };
}

export default async function ProjectDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getPublished("projects", slug);
  if (!project) notFound();

  const id = await getPublishedIdBySlug("projects", slug);
  const [related, allTags] = await Promise.all([
    getRelatedBySlug("projects", slug),
    id ? getEntityTags(id) : Promise.resolve([]),
  ]);
  const tech = allTags
    .filter((t) => t.startsWith(TECH_TAG_PREFIX))
    .map((t) => t.slice(TECH_TAG_PREFIX.length));

  const meta = project.metadata;
  const repo = typeof meta.repoUrl === "string" ? meta.repoUrl : null;
  const live = typeof meta.deployedUrl === "string" ? meta.deployedUrl : null;

  return (
    <article className="mx-auto max-w-3xl py-(--spacing-section)">
      <h1 className="font-(family-name:--font-display) text-[length:var(--text-title)] leading-tight tracking-tight text-balance">{project.title}</h1>
      {project.summary ? (
        <p className="mt-4 max-w-prose text-lg leading-relaxed text-(--color-ink-muted) text-pretty">{project.summary}</p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {repo ? (
          <a href={repo} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 rounded-md border border-(--color-border) px-3 py-1.5 text-sm transition-colors hover:bg-(--color-surface-sunken)">
            <Github className="size-4" /> Repo
          </a>
        ) : null}
        {live ? (
          <a href={live} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 rounded-md bg-(--color-ink) px-3 py-1.5 text-sm text-(--color-surface) transition-opacity hover:opacity-90">
            Live <ArrowUpRight className="size-4" />
          </a>
        ) : null}
      </div>

      {tech.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {tech.map((t) => (
            <li key={t} className="rounded-md bg-(--color-surface-sunken) px-2 py-0.5 font-(family-name:--font-mono) text-xs text-(--color-ink-muted)">{t}</li>
          ))}
        </ul>
      ) : null}

      {project.cover ? (
        <div className="mt-8 overflow-hidden rounded-xl border border-(--color-hairline)">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={project.cover.url} alt={project.cover.alt} className="w-full" />
        </div>
      ) : null}

      <div className="mt-8"><BlockRenderer blocks={project.body} /></div>
      <MiniAtlas type="projects" slug={slug} />
      <Related items={related} />
    </article>
  );
}
