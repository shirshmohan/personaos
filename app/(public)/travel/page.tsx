import { listPublished } from "@/features/entities/public";
import { CoverGrid } from "@/components/public/cover-grid";

export const dynamic = "force-dynamic";
export const metadata = { title: "Travel" };

export default async function List() {
  const items = await listPublished("travel");
  return (
    <div className="mx-auto max-w-3xl py-(--spacing-section)">
      <header className="mb-16">
        <p className="mb-3 font-(family-name:--font-mono) text-xs tracking-widest text-(--color-ink-muted) uppercase">Travel</p>
        <h1 className="font-(family-name:--font-display) text-[length:var(--text-title)] leading-tight tracking-tight">Places been</h1>
      </header>
      {items.length === 0 ? (
        <p className="text-sm text-(--color-ink-muted)">Nothing published yet.</p>
      ) : <CoverGrid items={items} base="/travel" />}
    </div>
  );
}
