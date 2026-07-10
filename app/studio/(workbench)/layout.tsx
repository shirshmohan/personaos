import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { StudioSidebar } from "@/components/studio/studio-sidebar";
import { SignOutButton } from "@/components/studio/sign-out-button";

/**
 * Defence in depth: middleware gates the route at the edge, and this server
 * component re-checks the session before rendering anything. Rule 7 — the
 * Studio is the source of truth, so it gets two locks.
 */
export default async function StudioLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session?.user) redirect("/studio/sign-in");

  return (
    <div className="min-h-dvh">
      <header className="flex items-center justify-between border-b border-(--color-border) px-(--spacing-gutter) py-4">
        <Link
          href="/studio"
          className="font-(family-name:--font-display) text-lg tracking-tight"
        >
          Studio
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-(--color-ink-muted) sm:inline">
            {session.user.email}
          </span>
          <SignOutButton />
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-(--spacing-gutter) py-8 md:flex-row md:gap-12">
        {/* Collapses above the content on mobile rather than hiding behind a drawer. */}
        <aside className="md:w-52 md:shrink-0">
          <StudioSidebar />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
