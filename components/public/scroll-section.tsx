"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { EntityRefDTO } from "@/features/entities/dto";

/**
 * A cinematic section preview. As it enters the viewport, the heading and cards
 * slide up and settle; cover imagery drifts slightly slower than the text
 * (parallax) for depth. Reduced-motion → everything static and immediate.
 *
 * Designed to look intentional even with ONE item — it reads as "here's Travel",
 * not "here's an empty box".
 */
export function ScrollSection({
  index,
  label,
  blurb,
  href,
  items,
}: {
  index: number;
  label: string;
  blurb: string;
  href: string;
  items: EntityRefDTO[];
}) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [offset, setOffset] = useState(0);
  const reduce = useRef(false);

  useEffect(() => {
    reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce.current) { setInView(true); return; }
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && setInView(true),
      { threshold: 0.15 },
    );
    io.observe(el);

    // Parallax: translate covers by a fraction of the section's scroll progress.
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const progress = 1 - rect.top / window.innerHeight; // 0..~2
        setOffset(Math.max(-30, Math.min(30, (progress - 0.5) * 40)));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => { io.disconnect(); window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);

  const enter = (d: number): React.CSSProperties => ({
    opacity: inView ? 1 : 0,
    transform: inView ? "none" : "translateY(28px)",
    transition: `opacity 0.7s var(--ease-quiet) ${d}ms, transform 0.7s var(--ease-quiet) ${d}ms`,
  });

  return (
    <section ref={ref} className="border-t border-(--color-hairline) py-20">
      <div style={enter(0)} className="mb-8 flex items-end justify-between">
        <div>
          <p className="mb-2 font-(family-name:--font-mono) text-xs tracking-widest text-(--color-ink-muted) tabular-nums">
            {String(index).padStart(2, "0")} — {label.toUpperCase()}
          </p>
          <h2 className="font-(family-name:--font-display) text-[length:var(--text-title)] leading-tight tracking-tight">
            {blurb}
          </h2>
        </div>
        <Link href={href} className="group hidden shrink-0 items-center gap-1.5 text-sm text-(--color-accent) sm:flex">
          All {label.toLowerCase()}
          <ArrowUpRight className="size-4 transition-transform duration-200 ease-(--ease-quiet) group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      {items.length > 0 ? (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {items.map((item, i) => (
            <li key={item.slug} style={enter(120 + i * 90)}>
              <Link href={`${href}/${item.slug}`} className="group block">
                <div className="aspect-[4/5] overflow-hidden rounded-xl border border-(--color-hairline) bg-(--color-surface-sunken)">
                  {item.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.cover.url}
                      alt={item.cover.alt}
                      loading="lazy"
                      style={{ transform: `translateY(${offset * 0.4}px) scale(1.1)` }}
                      className="h-full w-full object-cover transition-transform duration-700 ease-(--ease-quiet) group-hover:scale-[1.15]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center p-3 text-center font-(family-name:--font-display) text-lg text-(--color-ink-muted)">
                      {item.title}
                    </div>
                  )}
                </div>
                <p className="mt-2 truncate text-sm">{item.title}</p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <Link href={href} style={enter(120)} className="block rounded-xl border border-dashed border-(--color-border) px-6 py-10 text-sm text-(--color-ink-muted)">
          Nothing here yet — but the space is ready.
        </Link>
      )}
    </section>
  );
}
