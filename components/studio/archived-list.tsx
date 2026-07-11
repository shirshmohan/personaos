"use client";

import { useTransition } from "react";
import { restoreEntity } from "@/features/entities/relationship-actions";
import { EntityTypeIcon } from "@/components/shared/entity-type-icon";
import type { EntityType } from "@/features/entities/types";
import { Button } from "@/components/ui/button";

export function ArchivedList({
  items,
}: {
  items: { id: string; type: EntityType; title: string }[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <ul className="divide-y divide-(--color-border)">
      {items.map((e) => (
        <li key={e.id} className="flex items-center gap-3 py-2.5">
          <EntityTypeIcon type={e.type} className="text-(--color-ink-muted)" />
          <span className="flex-1 truncate text-sm text-(--color-ink-muted)">
            {e.title}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await restoreEntity(e.id, e.type);
              })
            }
          >
            Restore
          </Button>
        </li>
      ))}
    </ul>
  );
}
