import Link from "next/link";
import { FileText, Clock } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { EntityList } from "@/components/shared/entity-list";
import { EntityTypeIcon } from "@/components/shared/entity-type-icon";
import {
  getArchived,
  getDrafts,
  getEntityCounts,
  getRecentlyEdited,
} from "@/features/entities/queries";
import { ArchivedList } from "@/components/studio/archived-list";
import { ENTITY_TYPES, ENTITY_TYPE_META } from "@/features/entities/types";

export const metadata = { title: "Workbench" };

export default async function WorkbenchPage() {
  const [drafts, recent, counts, archived] = await Promise.all([
    getDrafts(),
    getRecentlyEdited(),
    getEntityCounts(),
    getArchived(),
  ]);

  return (
    <>
      <PageHeader
        title="Workbench"
        description="Everything in progress, and everything already made."
      />

      <section className="mb-12">
        <h2 className="mb-3 text-sm font-medium">Drafts</h2>
        {drafts.length > 0 ? (
          <EntityList entities={drafts} />
        ) : (
          <EmptyState
            icon={FileText}
            title="No drafts. Nothing is waiting on you."
          />
        )}
      </section>

      <section className="mb-12">
        <h2 className="mb-3 text-sm font-medium">Recently edited</h2>
        {recent.length > 0 ? (
          <EntityList entities={recent} />
        ) : (
          <EmptyState
            icon={Clock}
            title="Nothing written yet. The editor arrives in Milestone 3."
          />
        )}
      </section>

      {archived.length > 0 ? (
        <section className="mb-12">
          <h2 className="mb-3 text-sm font-medium">Archived</h2>
          <ArchivedList items={archived} />
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-sm font-medium">All entities</h2>
        <ul className="grid gap-px overflow-hidden rounded-lg border border-(--color-border) bg-(--color-border) sm:grid-cols-2 lg:grid-cols-3">
          {ENTITY_TYPES.map((type) => (
            <li key={type} className="bg-(--color-surface)">
              <Link
                href={`/studio/${type}`}
                className="flex h-full flex-col gap-1 p-4 transition-colors duration-150 ease-(--ease-quiet) hover:bg-(--color-surface-sunken)"
              >
                <div className="flex items-center gap-2">
                  <EntityTypeIcon
                    type={type}
                    className="text-(--color-ink-muted)"
                  />
                  <span className="text-sm font-medium">
                    {ENTITY_TYPE_META[type].label}
                  </span>
                  <span className="ml-auto font-(family-name:--font-display) text-lg text-(--color-ink-muted) tabular-nums">
                    {counts[type] ?? 0}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-(--color-ink-muted)">
                  {ENTITY_TYPE_META[type].blurb}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
