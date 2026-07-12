import { listCareer } from "@/features/entities/public";
import { Reveal } from "@/components/public/reveal";

export const dynamic = "force-dynamic";
export const metadata = { title: "Career" };

function year(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : String(d.getFullYear());
}

function range(start: string | null, end: string | null): string {
  const s = year(start);
  const e = year(end);
  if (s && e) return s === e ? s : `${s} — ${e}`;
  return s ?? e ?? "";
}

export default async function CareerPage() {
  const roles = await listCareer();
  return (
    <div className="py-(--spacing-section)">
      <header className="mb-16">
        <p className="mb-3 font-(family-name:--font-mono) text-xs tracking-widest text-(--color-ink-muted) uppercase">Career</p>
        <h1 className="font-(family-name:--font-display) text-[length:var(--text-title)] leading-tight tracking-tight">The work so far</h1>
      </header>
      {roles.length === 0 ? (
        <p className="text-sm text-(--color-ink-muted)">Nothing published yet.</p>
      ) : (
        <ol className="relative flex flex-col border-l border-(--color-hairline) pl-6">
          {roles.map((role, i) => (
            <Reveal key={role.slug} delay={i * 60}>
              <li className="relative pb-10">
                <span className="absolute top-1.5 -left-[1.6875rem] size-2.5 rounded-full bg-(--color-accent) ring-4 ring-(--color-surface)" />
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <h2 className="font-(family-name:--font-display) text-xl tracking-tight">{role.title}</h2>
                  {range(role.startDate, role.endDate) ? (
                    <span className="font-(family-name:--font-mono) text-xs text-(--color-ink-muted) tabular-nums">
                      {range(role.startDate, role.endDate)}
                    </span>
                  ) : null}
                </div>
                {role.employer || role.location ? (
                  <p className="mt-0.5 text-sm text-(--color-ink-muted)">
                    {[role.employer, role.location].filter(Boolean).join(" · ")}
                  </p>
                ) : null}
                {role.summary ? (
                  <p className="mt-2 max-w-prose text-sm leading-relaxed text-(--color-ink-muted) text-pretty">{role.summary}</p>
                ) : null}
              </li>
            </Reveal>
          ))}
        </ol>
      )}
    </div>
  );
}
