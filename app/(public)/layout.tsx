import Link from "next/link";

const experiences = [
  { href: "/career", label: "Career" },
  { href: "/writing", label: "Writing" },
  { href: "/travel", label: "Travel" },
  { href: "/train", label: "Train" },
  { href: "/library", label: "Library" },
  { href: "/gallery", label: "Gallery" },
  { href: "/connect", label: "Connect" },
];

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col px-(--spacing-gutter)">
      <header className="flex items-center justify-between py-8">
        <Link
          href="/"
          className="font-(family-name:--font-display) text-sm font-medium tracking-tight"
        >
          Persona OS
        </Link>
        {/* Experiences ship in M5 — the nav is intentionally not linked yet. */}
        <nav aria-label="Experiences">
          <ul className="flex gap-5 text-sm text-(--color-ink-muted)">
            {experiences.slice(0, 3).map((e) => (
              <li key={e.href}>{e.label}</li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-(--color-border) py-8 text-sm text-(--color-ink-muted)">
        Designed, engineered, and continuously evolving.
      </footer>
    </div>
  );
}
