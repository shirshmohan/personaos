import Link from "next/link";
import type { EntityRefDTO } from "@/features/entities/dto";
import { Reveal } from "./reveal";

export function CoverGrid({ items, base }: { items: EntityRefDTO[]; base: string }) {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {items.map((item, i) => (
        <Reveal key={item.slug} delay={(i % 6) * 50}>
          <li>
            <Link href={`${base}/${item.slug}`} className="group block">
              <div className="aspect-[4/3] overflow-hidden rounded-lg border border-(--color-hairline) bg-(--color-surface-sunken)">
                {item.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.cover.url} alt={item.cover.alt} loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 ease-(--ease-quiet) group-hover:scale-[1.04]" />
                ) : null}
              </div>
              <p className="mt-2 text-sm">{item.title}</p>
              {item.summary ? (
                <p className="truncate text-xs text-(--color-ink-muted)">{item.summary}</p>
              ) : null}
            </Link>
          </li>
        </Reveal>
      ))}
    </ul>
  );
}
