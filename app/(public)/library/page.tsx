import { listLibrary } from "@/features/entities/public";
import { LibraryGrid } from "@/components/public/library-grid";

export const dynamic = "force-dynamic";
export const metadata = { title: "Library" };

export default async function LibraryPage() {
  const items = await listLibrary();

  return (
    <div className="mx-auto max-w-3xl py-(--spacing-section)">
      <header className="mb-16">
        <p className="mb-3 font-(family-name:--font-mono) text-xs tracking-widest text-(--color-ink-muted) uppercase">
          Library
        </p>
        <h1 className="font-(family-name:--font-display) text-[length:var(--text-title)] leading-tight tracking-tight">
          Ranked, with reasons
        </h1>
      </header>

      {items.length === 0 ? (
        <p className="text-sm text-(--color-ink-muted)">Nothing published yet.</p>
      ) : (
        <LibraryGrid items={items} />
      )}
    </div>
  );
}
