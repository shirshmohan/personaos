import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

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
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col px-(--spacing-gutter)">
      <header className="flex items-center justify-between border-b border-(--color-border) py-6">
        <span className="font-(family-name:--font-display) text-sm font-medium tracking-tight">
          Studio
        </span>
        <span className="text-sm text-(--color-ink-muted)">
          {session.user.email}
        </span>
      </header>
      <main className="flex-1 py-12">{children}</main>
    </div>
  );
}
