"use client";

import { useMemo, useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { COMPANIES } from "@/features/train/companies";
import { Input } from "@/components/ui/input";

/** Where a problem was asked — fixed+extensible list, many per problem. */
export function CompanyPicker({
  value, onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const chosen = new Set(value);
  const pool = useMemo(() => Array.from(new Set<string>([...COMPANIES, ...value])), [value]);
  const matches = useMemo(() => {
    const q = draft.trim().toLowerCase();
    if (!q) return [];
    return pool.filter((c) => c.toLowerCase().includes(q) && !chosen.has(c)).slice(0, 6);
  }, [draft, pool, chosen]);
  const canCreate = draft.trim() && !pool.some((c) => c.toLowerCase() === draft.trim().toLowerCase());
  const add = (c: string) => { if (!chosen.has(c)) onChange([...value, c]); setDraft(""); };

  return (
    <div className="flex flex-col gap-2">
      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {value.map((c) => (
            <li key={c}>
              <button type="button" onClick={() => onChange(value.filter((x) => x !== c))}
                className="flex items-center gap-1 rounded-md border border-(--color-border) px-2 py-1 text-xs text-(--color-ink-muted) hover:text-(--color-ink)">
                {c}<X className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="relative">
        <Input value={draft} placeholder="Company that asked this (optional)"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (matches[0]) add(matches[0]); else if (canCreate) add(draft.trim()); } }} />
        {(matches.length > 0 || canCreate) && draft.trim() ? (
          <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-(--color-border) bg-(--color-surface) shadow-sm">
            {matches.map((m) => (
              <li key={m}><button type="button" onClick={() => add(m)}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-(--color-surface-sunken)">
                <Check className="size-3.5 text-(--color-ink-muted)" />{m}</button></li>
            ))}
            {canCreate ? (
              <li><button type="button" onClick={() => add(draft.trim())}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-(--color-accent) hover:bg-(--color-surface-sunken)">
                <Plus className="size-3.5" />Add &ldquo;{draft.trim()}&rdquo;</button></li>
            ) : null}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
