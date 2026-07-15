import { requireOwner } from "@/lib/auth/guard";
import { AddProblem } from "@/components/studio/add-problem";
import { listMyProblems, catalogCount } from "@/features/train/actions";

export const dynamic = "force-dynamic";

export default async function TrainProblemsPage() {
  await requireOwner();
  const [mine, count] = await Promise.all([listMyProblems(), catalogCount()]);

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <h1 className="font-(family-name:--font-display) text-3xl tracking-tight">Problems</h1>
        <p className="mt-1 text-sm text-(--color-ink-muted)">
          {count > 0
            ? `${count.toLocaleString()} problems in the catalog. Search, add the ones you've solved.`
            : "Catalog empty — run the seed script (scripts/seed-leetcode.mts) first."}
        </p>
      </header>

      <AddProblem />

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-medium">Solved ({mine.length})</h2>
        {mine.length === 0 ? (
          <p className="text-sm text-(--color-ink-muted)">None yet.</p>
        ) : (
          <ul className="divide-y divide-(--color-border)">
            {mine.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-2.5">
                {p.important ? <span className="text-amber-500">★</span> : null}
                <a href={p.url} target="_blank" rel="noreferrer" className="flex-1 truncate text-sm hover:underline">
                  {p.title}
                </a>
                {p.patterns.length > 0 ? (
                  <span className="hidden text-xs text-(--color-ink-muted) sm:inline">{p.patterns.join(" · ")}</span>
                ) : null}
                {p.companies && p.companies.length > 0 ? (
                  <span className="hidden text-xs text-(--color-accent) md:inline">{p.companies.join(", ")}</span>
                ) : null}
                <span className="text-xs text-(--color-ink-muted)">{p.difficulty}</span>
                {p.myRating ? <span className="font-(family-name:--font-mono) text-xs text-(--color-ink-muted)">{p.myRating}/5</span> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
