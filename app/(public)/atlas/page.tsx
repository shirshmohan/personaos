import { getFullGraph } from "@/features/atlas/graph";
import { AtlasGraph } from "@/components/public/atlas-graph";
import { ENTITY_TYPES, ENTITY_TYPE_META } from "@/features/entities/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Atlas" };

const TYPE_HUE: Record<string, number> = {
  career: 250, writing: 200, travel: 150, train: 300,
  library: 85, gallery: 20, projects: 330,
};

export default async function AtlasPage() {
  const graph = await getFullGraph();

  return (
    <div className="py-(--spacing-section)">
      <header className="mb-8">
        <p className="mb-3 font-(family-name:--font-mono) text-xs tracking-widest text-(--color-ink-muted) uppercase">Atlas</p>
        <h1 className="font-(family-name:--font-display) text-[length:var(--text-title)] leading-tight tracking-tight">The whole map</h1>
        <p className="mt-4 max-w-prose text-sm leading-relaxed text-(--color-ink-muted)">
          Every published entity and the relationships between them. Drag a node,
          hover to trace its connections, click to open it.
        </p>
      </header>

      <div className="rounded-2xl border border-(--color-hairline) bg-(--color-surface-sunken)/40">
        <AtlasGraph graph={graph} height={600} />
      </div>

      <ul className="mt-6 flex flex-wrap gap-4">
        {ENTITY_TYPES.map((t) => (
          <li key={t} className="flex items-center gap-1.5 text-xs text-(--color-ink-muted)">
            <span className="inline-block size-2.5 rounded-full" style={{ backgroundColor: `oklch(68% 0.13 ${TYPE_HUE[t]})` }} />
            {ENTITY_TYPE_META[t].label}
          </li>
        ))}
      </ul>
    </div>
  );
}
