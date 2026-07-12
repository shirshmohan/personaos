import Link from "next/link";
import { ArrowUpRight, Github } from "lucide-react";
import type { RichPreview } from "@/features/entities/public";
import { tierStyle } from "@/features/entities/tiers";

const shell =
  "block w-full max-w-lg overflow-hidden rounded-2xl border border-(--color-hairline) bg-(--color-surface)/90 backdrop-blur-sm shadow-2xl";
const tag =
  "font-(family-name:--font-mono) text-xs tracking-widest text-(--color-ink-muted) uppercase";

function Empty({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href} className={`${shell} px-6 py-8`}>
      <p className={tag}>{label}</p>
      <p className="mt-2 text-sm text-(--color-ink-muted)">
        Nothing here yet — the space is ready.
      </p>
    </Link>
  );
}

/** Career → a résumé entry materializing. */
export function CareerCard({ item, href }: { item: RichPreview | null; href: string }) {
  if (!item) return <Empty label="Career" href={href} />;
  const employer = typeof item.meta.employer === "string" ? item.meta.employer : null;
  return (
    <Link href={`${href}/${item.slug}`} className={`${shell} p-6`}>
      <p className={tag}>01 — Career</p>
      <h3 className="mt-3 font-(family-name:--font-display) text-2xl tracking-tight">{item.title}</h3>
      {employer ? <p className="mt-1 text-sm text-(--color-ink-muted)">{employer}</p> : null}
      {item.summary ? (
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-(--color-ink-muted)">{item.summary}</p>
      ) : null}
    </Link>
  );
}

/** Writing → a wide editorial card. */
export function WritingCard({ item, href }: { item: RichPreview | null; href: string }) {
  if (!item) return <Empty label="Writing" href={href} />;
  return (
    <Link href={`${href}/${item.slug}`} className={`${shell} p-8`}>
      <p className={tag}>02 — Writing</p>
      <h3 className="mt-4 font-(family-name:--font-display) text-3xl leading-tight tracking-tight text-balance">{item.title}</h3>
      {item.summary ? (
        <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-(--color-ink-muted)">{item.summary}</p>
      ) : null}
    </Link>
  );
}

/** Travel → full-bleed place photo. */
export function TravelCard({ item, href }: { item: RichPreview | null; href: string }) {
  if (!item) return <Empty label="Travel" href={href} />;
  return (
    <Link href={`${href}/${item.slug}`} className={shell}>
      {item.cover ? (
        <div className="relative aspect-[4/3]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.cover.url} alt={item.cover.alt} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-0 p-6">
            <p className="font-(family-name:--font-mono) text-xs tracking-widest text-white/70 uppercase">03 — Travel</p>
            <h3 className="mt-1 font-(family-name:--font-display) text-2xl text-white">{item.title}</h3>
          </div>
        </div>
      ) : (
        <div className="p-6"><p className={tag}>03 — Travel</p><h3 className="mt-2 text-2xl">{item.title}</h3></div>
      )}
    </Link>
  );
}

/** Train → a pattern card, terminal-flavored. */
export function TrainCard({ item, href }: { item: RichPreview | null; href: string }) {
  if (!item) return <Empty label="Train" href={href} />;
  return (
    <Link href={`${href}/${item.slug}`} className={`${shell} p-6`}>
      <p className={tag}>04 — Train</p>
      <p className="mt-3 font-(family-name:--font-mono) text-sm text-(--color-accent)">$ pattern --show</p>
      <h3 className="mt-2 font-(family-name:--font-display) text-2xl tracking-tight">{item.title}</h3>
      {item.summary ? <p className="mt-2 line-clamp-2 text-sm text-(--color-ink-muted)">{item.summary}</p> : null}
    </Link>
  );
}

/** Library → the cover with a glowing tier badge. */
export function LibraryCard({ item, href }: { item: RichPreview | null; href: string }) {
  if (!item) return <Empty label="Library" href={href} />;
  const tier = typeof item.meta.tier === "string" ? item.meta.tier : null;
  const style = tierStyle(tier);
  return (
    <Link href={`${href}/${item.slug}`} className={`${shell} flex gap-5 p-6`}>
      {item.cover ? (
        <div className="w-28 shrink-0 overflow-hidden rounded-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.cover.url} alt={item.cover.alt} className="aspect-[3/4] h-full w-full object-cover" />
        </div>
      ) : null}
      <div className="flex flex-col">
        <p className={tag}>05 — Library</p>
        {tier ? (
          <span className="mt-2 font-(family-name:--font-display) text-5xl leading-none"
            style={{ color: style?.color, textShadow: `0 0 24px ${style?.color}` }}>{tier}</span>
        ) : null}
        <h3 className="mt-2 font-(family-name:--font-display) text-xl tracking-tight">{item.title}</h3>
        {item.genres.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-1">
            {item.genres.slice(0, 3).map((g) => (
              <li key={g} className="rounded border border-(--color-hairline) px-1.5 py-0.5 text-xs text-(--color-ink-muted)">{g}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </Link>
  );
}

/** Gallery → full-bleed visual. */
export function GalleryCard({ item, href }: { item: RichPreview | null; href: string }) {
  if (!item) return <Empty label="Gallery" href={href} />;
  return (
    <Link href={`${href}/${item.slug}`} className={shell}>
      {item.cover ? (
        <div className="relative aspect-square">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.cover.url} alt={item.cover.alt} className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6">
            <p className="font-(family-name:--font-mono) text-xs tracking-widest text-white/70 uppercase">06 — Gallery</p>
            <h3 className="mt-1 font-(family-name:--font-display) text-xl text-white">{item.title}</h3>
          </div>
        </div>
      ) : <div className="p-6"><p className={tag}>06 — Gallery</p><h3 className="mt-2 text-xl">{item.title}</h3></div>}
    </Link>
  );
}

/** Projects → repo/live + tech, terminal-flavored. */
export function ProjectCard({ item, href }: { item: RichPreview | null; href: string }) {
  if (!item) return <Empty label="Projects" href={href} />;
  const repo = typeof item.meta.repoUrl === "string" ? item.meta.repoUrl : null;
  return (
    <Link href={`${href}/${item.slug}`} className={`${shell} p-6`}>
      <p className={tag}>07 — Projects</p>
      <h3 className="mt-3 font-(family-name:--font-display) text-2xl tracking-tight">{item.title}</h3>
      {item.summary ? <p className="mt-2 line-clamp-2 text-sm text-(--color-ink-muted)">{item.summary}</p> : null}
      <div className="mt-4 flex items-center gap-3 text-xs text-(--color-ink-muted)">
        {repo ? <span className="flex items-center gap-1"><Github className="size-3.5" /> Repo</span> : null}
        <span className="flex items-center gap-1 text-(--color-accent)">Open <ArrowUpRight className="size-3" /></span>
      </div>
    </Link>
  );
}
