"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { LibraryItem } from "@/features/entities/public";
import { TIER_ORDER, TIER_STYLES, tierStyle } from "@/features/entities/tiers";

export function LibraryGrid({ items }: { items: LibraryItem[] }) {
  const [genre, setGenre] = useState<string | null>(null);

  const allGenres = useMemo(
    () => Array.from(new Set(items.flatMap((i) => i.genres))).sort(),
    [items],
  );

  const filtered = genre ? items.filter((i) => i.genres.includes(genre)) : items;

  const rows = useMemo(() => {
    const map = new Map<string, LibraryItem[]>();
    for (const t of TIER_ORDER) map.set(t, []);
    const unranked: LibraryItem[] = [];
    for (const item of filtered) {
      if (item.tier && map.has(item.tier)) map.get(item.tier)!.push(item);
      else unranked.push(item);
    }
    const out = [...map.entries()]
      .filter(([, l]) => l.length > 0)
      .map(([t, l]) => ({ tier: t, items: l }));
    if (unranked.length) out.push({ tier: "—", items: unranked });
    return out;
  }, [filtered]);

  return (
    <div>
      {allGenres.length > 0 ? (
        <div className="mb-14 flex flex-wrap gap-1.5">
          <FilterChip active={genre === null} onClick={() => setGenre(null)}>
            All
          </FilterChip>
          {allGenres.map((g) => (
            <FilterChip
              key={g}
              active={genre === g}
              onClick={() => setGenre(g === genre ? null : g)}
            >
              {g}
            </FilterChip>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-5">
        {rows.map(({ tier, items: list }) => {
          const style = tierStyle(tier);
          return (
            <section
              key={tier}
              className="flex gap-4 overflow-hidden rounded-2xl border border-(--color-hairline) sm:gap-6"
              style={style ? { backgroundColor: style.wash } : undefined}
            >
              {/* The tier letter — the drama. Big, coloured, a chapter marker. */}
              <div
                className="flex w-16 shrink-0 items-center justify-center sm:w-24"
                style={
                  style
                    ? { borderRight: `2px solid ${style.color}` }
                    : { borderRight: "2px solid var(--color-hairline)" }
                }
              >
                <span
                  className="font-(family-name:--font-display) text-5xl leading-none sm:text-7xl"
                  style={{ color: style?.color ?? "var(--color-ink-muted)" }}
                >
                  {tier}
                </span>
              </div>

              <ul className="grid flex-1 grid-cols-3 gap-3 py-4 pr-4 sm:grid-cols-4 sm:gap-4 lg:grid-cols-6">
                {list.map((item) => (
                  <li key={item.slug}>
                    <Link href={`/library/${item.slug}`} className="group block">
                      <div className="aspect-[3/4] overflow-hidden rounded-lg bg-(--color-surface-sunken) shadow-sm ring-1 ring-(--color-hairline) transition-all duration-300 ease-(--ease-quiet) group-hover:-translate-y-1 group-hover:shadow-md">
                        {item.cover ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.cover.url}
                            alt={item.cover.alt}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <p className="mt-1.5 truncate text-xs font-medium">
                        {item.title}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      {/* Legend — teaches the colour language without a wall of text. */}
      <div className="mt-10 flex flex-wrap gap-3">
        {TIER_ORDER.map((t) => (
          <span key={t} className="flex items-center gap-1.5 text-xs text-(--color-ink-muted)">
            <span
              className="inline-block size-2.5 rounded-full"
              style={{ backgroundColor: TIER_STYLES[t].color }}
            />
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full border px-3 py-1 text-xs transition-colors duration-150",
        active
          ? "border-(--color-ink) bg-(--color-ink) text-(--color-surface)"
          : "border-(--color-border) text-(--color-ink-muted) hover:text-(--color-ink)",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
