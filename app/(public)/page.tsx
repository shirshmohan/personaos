import Link from "next/link";
import { ENTITY_TYPES, ENTITY_TYPE_META } from "@/features/entities/types";
import { getPreview } from "@/features/entities/public";
import { getFullGraph } from "@/features/atlas/graph";
import { StoryHero } from "@/components/public/story-hero";
import { ScrollSection } from "@/components/public/scroll-section";

export const dynamic = "force-dynamic";

const SECTION_ORDER = ENTITY_TYPES;

export default async function HomePage() {
  const [graph, ...previews] = await Promise.all([
    getFullGraph(),
    ...SECTION_ORDER.map((t) => getPreview(t, 4)),
  ]);

  return (
    <div>
      <StoryHero graph={graph} />

      {/* CINEMATIC SECTIONS — a tour through the site. */}
      {SECTION_ORDER.map((type, i) => (
        <ScrollSection
          key={type}
          index={i + 1}
          label={ENTITY_TYPE_META[type].label}
          blurb={ENTITY_TYPE_META[type].blurb}
          href={`/${type}`}
          items={previews[i]}
        />
      ))}
    </div>
  );
}
