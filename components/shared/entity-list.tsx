import Link from "next/link";
import type { Entity } from "@/lib/db/schema";
import { EntityTypeIcon } from "./entity-type-icon";

/**
 * The one and only way an entity is rendered in a list. Rule 5 — if you find
 * yourself writing a second version of this, you want a prop, not a copy.
 */
export function EntityList({ entities }: { entities: Entity[] }) {
  return (
    <ul className="divide-y divide-(--color-border)">
      {entities.map((entity) => (
        <li key={entity.id}>
          <Link
            href={`/studio/${entity.type}/${entity.slug}`}
            className="flex items-center gap-3 py-3 transition-colors duration-150 ease-(--ease-quiet) hover:bg-(--color-surface-sunken)"
          >
            <EntityTypeIcon
              type={entity.type}
              className="shrink-0 text-(--color-ink-muted)"
            />
            <span className="flex-1 truncate text-sm">{entity.title}</span>
            {entity.status === "draft" ? (
              <span className="shrink-0 text-xs text-(--color-ink-muted)">
                Draft
              </span>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}
