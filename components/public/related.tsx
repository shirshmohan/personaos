import Link from "next/link";
import type { RelatedEntityDTO } from "@/features/entities/dto";
import { ENTITY_TYPE_META } from "@/features/entities/types";

export function Related({ items }: { items: RelatedEntityDTO[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mt-16 border-t border-(--color-hairline) pt-8">
      <h2 className="mb-4 font-(family-name:--font-mono) text-xs tracking-widest text-(--color-ink-muted) uppercase">
        Connected
      </h2>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={`${item.type}-${item.slug}`}>
            <Link
              href={`/${item.type}/${item.slug}`}
              className="group flex items-baseline gap-3 py-1"
            >
              <span className="font-(family-name:--font-mono) text-xs text-(--color-ink-muted)">
                {ENTITY_TYPE_META[item.type].label}
              </span>
              <span className="text-sm transition-transform duration-200 ease-(--ease-quiet) group-hover:translate-x-0.5">
                {item.title}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
