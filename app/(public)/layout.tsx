import Link from "next/link";
import { ENTITY_TYPES, ENTITY_TYPE_META } from "@/features/entities/types";

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col px-(--spacing-gutter)">
      <header className="flex items-center justify-between py-6">
        <Link
          href="/"
          className="font-(family-name:--font-display) text-lg tracking-tight"
        >
          Shirsh Mohan
        </Link>
        <nav aria-label="Sections">
          <ul className="flex gap-4 font-(family-name:--font-mono) text-xs text-(--color-ink-muted) uppercase">
            {ENTITY_TYPES.slice(0, 4).map((type) => (
              <li key={type}>
                <Link
                  href={`/${type}`}
                  className="transition-colors hover:text-(--color-ink)"
                >
                  {ENTITY_TYPE_META[type].label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-24 flex items-center justify-between border-t border-(--color-hairline) py-8 font-(family-name:--font-mono) text-xs text-(--color-ink-muted)">
        <span>Persona OS</span>
        <span>Designed &amp; engineered by its subject</span>
      </footer>
    </div>
  );
}
