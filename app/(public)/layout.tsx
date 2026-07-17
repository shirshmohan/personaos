import Link from "next/link";
import { ENTITY_TYPES, ENTITY_TYPE_META } from "@/features/entities/types";
import { ThemeSwitcher } from "@/components/public/theme-switcher";
import { getTheme } from "@/features/theme/server";
import { PageTransition } from "@/components/public/page-transition";

export default async function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const theme = await getTheme();
  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col px-(--spacing-gutter)">
      <header className="relative z-20 flex items-center justify-between py-6">
        <Link
          href="/"
          className="font-(family-name:--font-display) text-lg tracking-tight"
        >
          Shirsh Mohan
        </Link>
        <div className="flex items-center gap-5">
          <nav aria-label="Sections">
            <ul className="flex gap-4 font-(family-name:--font-mono) text-xs text-(--color-ink-muted) uppercase">
              {ENTITY_TYPES.map((type) => (
                <li key={type}>
                  <Link
                    href={`/${type}`}
                    className="relative transition-colors hover:text-(--color-ink) after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-0 after:bg-(--color-ink) after:transition-all after:duration-300 after:ease-(--ease-quiet) hover:after:w-full"
                  >
                    {ENTITY_TYPE_META[type].label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/atlas" className="transition-colors hover:text-(--color-ink)">
                  Atlas
                </Link>
              </li>
            </ul>
          </nav>
          <ThemeSwitcher current={theme} />
        </div>
      </header>

      <main className="relative z-10 flex-1"><PageTransition>{children}</PageTransition></main>

      <footer className="relative z-20 mt-24 flex items-center justify-between border-t border-(--color-hairline) py-8 font-(family-name:--font-mono) text-xs text-(--color-ink-muted)">
        <span>Persona OS</span>
        <span>Designed &amp; engineered by its subject</span>
      </footer>
    </div>
  );
}
