"use client";

import { useEffect, useRef, useState } from "react";
import type { RichPreview } from "@/features/entities/public";
import type { Graph } from "@/features/atlas/graph";
import { HeroAtlas } from "./hero-atlas";
import {
  CareerCard, WritingCard, TravelCard, TrainCard, LibraryCard, GalleryCard, ProjectCard,
} from "./section-cards";

export interface ScrubStep { type: string; item: RichPreview | null; }

/**
 * The "one fixed window". The graph is pinned full-screen for the whole
 * section; as you scroll, exactly one card flies in over it, holds, then flies
 * out as the next flies in. Scroll position is a timeline scrubber — the page
 * itself never appears to move; the content over the fixed graph changes.
 *
 * Implemented as a tall sticky container: N steps => N screen-heights of scroll.
 * Each step owns a scroll band; a card's opacity/offset is a function of how
 * far into its band you are (fade in → hold → fade out).
 *
 * Mobile / reduced-motion: no pinning — cards simply stack in order.
 */
export function PinnedScrubber({ graph, steps }: { graph: Graph; steps: ScrubStep[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(0); // 0..steps.length, continuous scroll position
  const [simple, setSimple] = useState(false);

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 768px)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (mobile || reduce) { setSimple(true); return; }

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const total = rect.height - window.innerHeight;
        const scrolled = Math.min(total, Math.max(0, -rect.top));
        setP((scrolled / total) * steps.length);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, [steps.length]);

  function renderCard(step: ScrubStep) {
    const href = `/${step.type}`;
    switch (step.type) {
      case "career": return <CareerCard item={step.item} href={href} />;
      case "writing": return <WritingCard item={step.item} href={href} />;
      case "travel": return <TravelCard item={step.item} href={href} />;
      case "train": return <TrainCard item={step.item} href={href} />;
      case "library": return <LibraryCard item={step.item} href={href} />;
      case "gallery": return <GalleryCard item={step.item} href={href} />;
      case "projects": return <ProjectCard item={step.item} href={href} />;
      default: return null;
    }
  }

  // MOBILE / reduced-motion: stacked, no pin.
  if (simple) {
    return (
      <div className="flex flex-col gap-16 py-16">
        {steps.map((step, i) => (
          <div key={i} className="flex justify-center">{renderCard(step)}</div>
        ))}
      </div>
    );
  }

  return (
    <div ref={ref} style={{ height: `${steps.length * 100}vh` }} className="relative">
      <div className="sticky top-0 h-dvh overflow-hidden">
        {/* fixed graph stage */}
        <div className="absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_80%_75%_at_50%_50%,black_35%,transparent)]">
          <HeroAtlas graph={graph} />
        </div>

        {/* cards, each owning a scroll band */}
        <div className="absolute inset-0 flex items-center justify-center">
          {steps.map((step, i) => {
            // local progress within this step's band: -1 (before) .. 0 (centred) .. +1 (after)
            const d = p - i - 0.5; // 0 when centred in band
            const local = Math.max(-1.2, Math.min(1.2, d * 2));
            const opacity = Math.max(0, 1 - Math.abs(local) * 1.1);
            const translateY = local * -40; // rise as it enters, continue up as it leaves
            const scale = 1 - Math.abs(local) * 0.04;
            const active = Math.abs(d) < 0.5;
            return (
              <div
                key={i}
                aria-hidden={!active}
                className="absolute px-6"
                style={{
                  opacity,
                  transform: `translateY(${translateY}px) scale(${scale})`,
                  pointerEvents: active ? "auto" : "none",
                  transition: "opacity 0.1s linear",
                }}
              >
                {renderCard(step)}
              </div>
            );
          })}
        </div>

        {/* progress dots */}
        <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 gap-1.5">
          {steps.map((_, i) => {
            const active = Math.abs(p - i - 0.5) < 0.5;
            return (
              <span key={i}
                className="size-1.5 rounded-full transition-colors duration-300"
                style={{ backgroundColor: active ? "var(--color-accent)" : "var(--color-hairline)" }} />
            );
          })}
        </div>
      </div>
    </div>
  );
}
