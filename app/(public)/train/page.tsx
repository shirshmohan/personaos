import Link from "next/link";
import { listPatterns } from "@/features/train/public";
import { Reveal } from "@/components/public/reveal";

export const dynamic = "force-dynamic";
export const metadata = { title: "Train" };

export default async function TrainPage() {
  const patterns = await listPatterns();
  return (
    <div className="mx-auto max-w-3xl py-(--spacing-section)">
      <header className="mb-16">
        <p className="mb-3 font-(family-name:--font-mono) text-xs tracking-widest text-(--color-ink-muted) uppercase">Train</p>
        <h1 className="font-(family-name:--font-display) text-[length:var(--text-title)] leading-tight tracking-tight">Patterns</h1>
        <p className="mt-4 max-w-prose text-sm leading-relaxed text-(--color-ink-muted)">
          How I actually think about problems — grouped by the pattern that unlocks them, not the problem count.
        </p>
      </header>

      {patterns.length === 0 ? (
        <p className="text-sm text-(--color-ink-muted)">No patterns yet.</p>
      ) : (
        <ul className="border-t border-(--color-hairline)">
          {patterns.map((p, i) => (
            <Reveal key={p.slug} delay={i * 40}>
              <li className="border-b border-(--color-hairline)">
                <Link href={`/train/${p.slug}`} className="group flex items-baseline gap-4 py-4">
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
      )}
    </div>
  );
}
