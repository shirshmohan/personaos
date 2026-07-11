"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { TECH_SUGGESTIONS } from "@/features/entities/tech";
import { Input } from "@/components/ui/input";

/**
 * Free tags with suggestions (D42) — type anything, autocomplete against a seed
 * list. Distinct from genre's fixed multiselect on purpose: tech is open-ended.
 */
export function TechInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const selected = new Set(value.map((v) => v.toLowerCase()));

  const matches = useMemo(() => {
    const q = draft.trim().toLowerCase();
    if (!q) return [];
    return TECH_SUGGESTIONS.filter(
      (t) => t.toLowerCase().includes(q) && !selected.has(t.toLowerCase()),
    ).slice(0, 6);
  }, [draft, selected]);

  function add(name: string) {
    const clean = name.trim();
    if (!clean || selected.has(clean.toLowerCase())) return setDraft("");
    onChange([...value, clean]);
    setDraft("");
  }

  return (
    <div className="flex flex-col gap-2">
      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {value.map((t) => (
            <li key={t}>
              <button
                type="button"
                aria-label={`Remove ${t}`}
                onClick={() => onChange(value.filter((x) => x !== t))}
                className="flex items-center gap-1 rounded-md border border-(--color-border) px-2 py-1 text-xs text-(--color-ink-muted) hover:text-(--color-ink)"
              >
                {t}
                <X className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="relative">
        <Input
          value={draft}
          placeholder="Add tech — type to search or invent"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(matches[0] ?? draft);
            }
          }}
        />
        {matches.length > 0 ? (
          <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-(--color-border) bg-(--color-surface) shadow-sm">
            {matches.map((m) => (
              <li key={m}>
                <button
                  type="button"
                  onClick={() => add(m)}
                  className="block w-full px-3 py-1.5 text-left text-sm hover:bg-(--color-surface-sunken)"
                >
                  {m}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
