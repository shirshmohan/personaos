import Link from "next/link";
import { listPublished } from "@/features/entities/public";
import { Reveal } from "@/components/public/reveal";

export const dynamic = "force-dynamic";
export const metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const items = await listPublished("projects");
  return (
    <div className="py-(--spacing-section)">
      <header className="mb-16">
        <p className="mb-3 font-(family-name:--font-mono) text-xs tracking-widest text-(--color-ink-muted) uppercase">Projects</p>
        <h1 className="font-(family-name:--font-display) text-[length:var(--text-title)] leading-tight tracking-tight">Things built</h1>
      </header>
      {items.length === 0 ? (
        <p className="text-sm text-(--color-ink-muted)">Nothing published yet.</p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2">
          {items.map((p, i) => (
            <Reveal key={p.slug} delay={(i % 4) * 60}>
              <li>
                <Link href={`/projects/${p.slug}`} className="group flex h-full flex-col overflow-hidden rounded-xl border border-(--color-hairline) transition-colors hover:border-(--color-border)">
                  {p.cover ? (
                    <div className="aspect-video overflow-hidden bg-(--color-surface-sunken)">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.cover.url} alt={p.cover.alt} loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 ease-(--ease-quiet) group-hover:scale-[1.03]" />
                    </div>
                  ) : null}
                  <div className="flex flex-1 flex-col p-5">
                    <h2 className="font-(family-name:--font-display) text-xl tracking-tight">{p.title}</h2>
                    {p.summary ? (
                      <p className="mt-1.5 text-sm leading-relaxed text-(--color-ink-muted)">{p.summary}</p>
                    ) : null}
                  </div>
                </Link>
              </li>
            </Reveal>
          ))}
        </ul>
      )}
    </div>
  );
}
