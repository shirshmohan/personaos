"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import {
  addRelationship,
  removeRelationship,
} from "@/features/entities/relationship-actions";
import { searchEntitiesAction } from "@/features/entities/search-action";
import { RELATIONSHIP_TYPES, type RelationshipType } from "@/lib/db/schema";
import { EntityTypeIcon } from "@/components/shared/entity-type-icon";
import type { EntityType } from "@/features/entities/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export interface RelationshipRow {
  id: string;
  type: RelationshipType;
  entity: { id: string; type: EntityType; slug: string; title: string };
}

const LABEL: Record<RelationshipType, string> = {
  related_to: "Related to",
  part_of: "Part of",
  inspired_by: "Inspired by",
  located_at: "Located at",
  references: "References",
};

export function RelationshipEditor({
  entityId,
  initial,
}: {
  entityId: string;
  initial: RelationshipRow[];
}) {
  const [rows, setRows] = useState(initial);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RelationshipRow["entity"][]>([]);
  const [type, setType] = useState<RelationshipType>("related_to");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function search(q: string) {
    setQuery(q);
    setError(null);
    if (!q.trim()) return setResults([]);
    startTransition(async () => setResults(await searchEntitiesAction(q, entityId)));
  }

  function connect(target: RelationshipRow["entity"]) {
    startTransition(async () => {
      const res = await addRelationship(entityId, target.id, type);
      if (!res.ok) return setError(res.error);
      setRows((p) => [...p, { id: crypto.randomUUID(), type, entity: target }]);
      setQuery("");
      setResults([]);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {rows.length > 0 ? (
        <ul className="divide-y divide-(--color-border)">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-3 py-2.5">
              <span className="w-28 shrink-0 text-xs text-(--color-ink-muted)">
                {LABEL[r.type]}
              </span>
              <EntityTypeIcon type={r.entity.type} className="text-(--color-ink-muted)" />
              <span className="flex-1 truncate text-sm">{r.entity.title}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={`Disconnect ${r.entity.title}`}
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await removeRelationship(r.id);
                    setRows((p) => p.filter((x) => x.id !== r.id));
                  })
                }
              >
                <X className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-(--color-ink-muted)">
          Nothing connected yet. Relationships are what make the Atlas worth having.
        </p>
      )}

      <div className="flex gap-2">
        <Select
          className="w-40 shrink-0"
          value={type}
          onChange={(e) => setType(e.target.value as RelationshipType)}
        >
          {RELATIONSHIP_TYPES.map((t) => (
            <option key={t} value={t}>
              {LABEL[t]}
            </option>
          ))}
        </Select>
        <Input
          value={query}
          placeholder="Search entities to connect…"
          onChange={(e) => search(e.target.value)}
        />
      </div>

      {error ? (
        <p role="alert" className="text-xs text-(--color-ink-muted)">{error}</p>
      ) : null}

      {results.length > 0 ? (
        <ul className="rounded-md border border-(--color-border)">
          {results.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                disabled={pending}
                onClick={() => connect(r)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-(--color-surface-sunken)"
              >
                <EntityTypeIcon type={r.type} className="text-(--color-ink-muted)" />
                {r.title}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
