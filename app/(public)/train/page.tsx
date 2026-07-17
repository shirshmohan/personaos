import Link from "next/link";
import { listPatterns, getTrainGraph } from "@/features/train/public";
import { TrainGraphView } from "@/components/public/train-graph";
import { NeuralBackdrop } from "@/components/public/neural-backdrop";
import { Reveal } from "@/components/public/reveal";

export const dynamic = "force-dynamic";
export const metadata = { title: "Train" };

export default async function TrainPage() {
  const [patterns, graph] = await Promise.all([listPatterns(), getTrainGraph()]);

  return (
    <>
      {/* The whole page is the network — the graph grows out of it rather than
          sitting in a panel drawn on top of a picture of one. */}
      <NeuralBackdrop />

      <div className="relative z-10 mx-auto max-w-5xl py-(--spacing-section)">
        <header className="mb-10">
          <p className="mb-3 font-(family-name:--font-mono) text-xs tracking-widest text-(--color-ink-muted) uppercase">
            Train
          </p>
          <h1 className="font-(family-name:--font-display) text-[length:var(--text-title)] leading-tight tracking-tight">
            Patterns
          </h1>
          <p className="mt-4 max-w-prose text-sm leading-relaxed text-(--color-ink-muted)">
            Every problem I&apos;ve solved, mapped under the pattern that unlocks
            it. Big nodes are patterns; the dots around them are problems — green
            easy, amber medium, red hard. Drag to explore, click a problem to
            open it.
          </p>
        </header>

        {/* No border, no panel: a frame around the graph would just be a
            rectangle drawn across the tissue it's meant to be growing in. */}
        {graph.nodes.length > 0 ? (
          <div className="mb-12 -mx-[calc(50vw-50%)]">
            <TrainGraphView graph={graph} height={620} />
          </div>
        ) : null}

        {patterns.length > 0 ? (
          <ul className="mx-auto max-w-3xl border-t border-(--color-hairline)/60">
            {patterns.map((p, i) => (
              <Reveal key={p.slug} delay={i * 30}>
                <li className="border-b border-(--color-hairline)/60">
                  <Link
                    href={`/train/${p.slug}`}
                    className="group flex items-baseline gap-4 py-4"
                  >
                    <span className="font-(family-name:--font-display) text-xl tracking-tight transition-transform duration-200 ease-(--ease-quiet) group-hover:translate-x-1">
                      {p.title}
                    </span>
                    <span className="ml-auto font-(family-name:--font-mono) text-xs text-(--color-ink-muted) tabular-nums">
                      {p.count} {p.count === 1 ? "problem" : "problems"}
                    </span>
                  </Link>
                </li>
              </Reveal>
            ))}
          </ul>
        ) : null}
      </div>
    </>
  );
}
