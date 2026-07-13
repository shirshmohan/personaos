"use client";

import { useMemo, useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { DSA_PATTERNS } from "@/features/train/patterns";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

/** Fixed+extensible pattern list (D53). Suggested patterns pre-selected; search
 *  the list, or create a new pattern that becomes a Train entity on save. */
export function PatternPicker({
  value, suggestions, onChange,
}: {
  value: string[];
  suggestions: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const chosen = new Set(value);

  const pool = useMemo(
    () => Array.from(new Set<string>([...DSA_PATTERNS, ...suggestions, ...value])),
    [suggestions, value],
  );
  const matches = useMemo(() => {
    const q = draft.trim().toLowerCase();
    if (!q) return [];
    return pool.filter((p) => p.toLowerCase().includes(q) && !chosen.has(p)).slice(0, 6);
  }, [draft, pool, chosen]);
  const canCreate = draft.trim() && !pool.some((p) => p.toLowerCase() === draft.trim().toLowerCase());

  const add = (p: string) => { if (!chosen.has(p)) onChange([...value, p]); setDraft(""); };

  return (
    <div className="flex flex-col gap-2">
      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {value.map((p) => (
            <li key={p}>
              <button type="button" onClick={() => onChange(value.filter((x) => x !== p))}
                className="flex items-center gap-1 rounded-md border border-(--color-ink) bg-(--color-ink) px-2 py-1 text-xs text-(--color-surface)">
                {p}<X className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {suggestions.filter((s) => !chosen.has(s)).length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-(--color-ink-muted)">Suggested:</span>
          {suggestions.filter((s) => !chosen.has(s)).map((s) => (
            <button key={s} type="button" onClick={() => add(s)}
              className="flex items-center gap-1 rounded-md border border-dashed border-(--color-border) px-2 py-1 text-xs text-(--color-ink-muted) hover:text-(--color-ink)">
              <Plus className="size-3" />{s}
            </button>
          ))}
        </div>
      ) : null}

      <div className="relative">
        <Input value={draft} placeholder="Search patterns or create one"
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
                <Plus className="size-3.5" />Create &ldquo;{draft.trim()}&rdquo;</button></li>
            ) : null}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
