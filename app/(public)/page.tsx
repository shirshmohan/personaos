import { ENTITY_TYPES } from "@/features/entities/types";
import { getRichPreview } from "@/features/entities/public";
import { getFullGraph } from "@/features/atlas/graph";
import { StoryHero } from "@/components/public/story-hero";
import { PinnedScrubber, type ScrubStep } from "@/components/public/pinned-scrubber";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [graph, ...previews] = await Promise.all([
    getFullGraph(),
    ...ENTITY_TYPES.map((t) => getRichPreview(t)),
  ]);

  const steps: ScrubStep[] = ENTITY_TYPES.map((type, i) => ({
    type,
    item: previews[i],
  }));

  return (
    <div>
      <StoryHero graph={graph} />
      <PinnedScrubber graph={graph} steps={steps} />
    </div>
  );
}
