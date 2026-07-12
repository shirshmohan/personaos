import { getLocalGraph } from "@/features/atlas/graph";
import { AtlasGraph } from "./atlas-graph";
import type { EntityType } from "@/lib/db/schema";

/** Server component: fetches the local graph, renders the interactive view. */
export async function MiniAtlas({ type, slug }: { type: EntityType; slug: string }) {
  const graph = await getLocalGraph(type, slug);
  if (graph.nodes.length <= 1) return null; // nothing connected — show nothing
  return (
    <section className="mt-16 border-t border-(--color-hairline) pt-8">
      <h2 className="mb-4 font-(family-name:--font-mono) text-xs tracking-widest text-(--color-ink-muted) uppercase">
        Connected
      </h2>
      <div className="rounded-xl border border-(--color-hairline) bg-(--color-surface-sunken)/40">
        <AtlasGraph graph={graph} height={340} />
      </div>
    </section>
  );
}
