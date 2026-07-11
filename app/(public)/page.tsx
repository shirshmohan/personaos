import Link from "next/link";

// Reads live published counts, so it renders per request rather than at build.
export const dynamic = "force-dynamic";
import { ENTITY_TYPES, ENTITY_TYPE_META } from "@/features/entities/types";
import { getPublishedCountsByType } from "@/features/entities/public";

export default async function HomePage() {
  const counts = await getPublishedCountsByType();

  return (
    <div className="py-(--spacing-section)">
      <section className="max-w-3xl">
        <p className="mb-6 font-(family-name:--font-mono) text-xs tracking-widest text-(--color-ink-muted) uppercase">
          Persona OS — a personal operating system
        </p>
        <h1 className="font-(family-name:--font-display) text-[length:var(--text-hero)] leading-[1.02] font-normal tracking-tight text-balance">
          Designed, engineered,
          <br />
          and continuously evolving.
        </h1>
        <p className="mt-8 max-w-md text-base leading-relaxed text-(--color-ink-muted) text-pretty">
          Work, writing, travel, practice, and the things worth keeping —
          authored once, connected, and open to read.
        </p>
      </section>

      <section className="mt-24">
        <p className="mb-6 font-(family-name:--font-mono) text-xs tracking-widest text-(--color-ink-muted) uppercase">
          Index
        </p>
        <ul className="border-t border-(--color-hairline)">
          {ENTITY_TYPES.map((type, i) => {
            const meta = ENTITY_TYPE_META[type];
            const count = counts[type] ?? 0;
            return (
              <li key={type} className="border-b border-(--color-hairline)">
                <Link
                  href={`/${type}`}
                  className="group flex items-baseline gap-4 py-5 transition-colors duration-200 ease-(--ease-quiet) sm:gap-8"
                >
                  <span className="font-(family-name:--font-mono) text-xs text-(--color-ink-muted) tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-(family-name:--font-display) text-[length:var(--text-title)] leading-none tracking-tight transition-transform duration-200 ease-(--ease-quiet) group-hover:translate-x-1">
                    {meta.label}
                  </span>
                  <span className="ml-auto font-(family-name:--font-mono) text-xs text-(--color-ink-muted) tabular-nums">
                    {count > 0 ? String(count).padStart(2, "0") : "—"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
