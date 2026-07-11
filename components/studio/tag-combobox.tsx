"use client";

import { useMemo, useState } from "react";
import { Plus, Tag as TagIcon, X } from "lucide-react";
import { parseTagInput } from "@/features/entities/tag-parse";
import { Input } from "@/components/ui/input";

/**
 * Type to filter your own past tags, pick a match, or press Enter to create a
 * new one that then joins the vocabulary. Replaces the plain Tags field — same
 * data, better input. Existing tags are only ever *offered*, never altered.
 */
export function TagCombobox({
  value,
  vocabulary,
  onChange,
}: {
  value: string[];
  vocabulary: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const chosen = new Set(value.map((v) => v.toLowerCase()));

  const { matches, canCreate } = useMemo(() => {
    const q = draft.trim().toLowerCase();
    if (!q) return { matches: [] as string[], canCreate: false };
    const pool = Array.from(new Set([...vocabulary, ...value]));
    const matches = pool
      .filter((t) => t.toLowerCase().includes(q) && !chosen.has(t.toLowerCase()))
      .slice(0, 6);
    const exact = pool.some((t) => t.toLowerCase() === q);
    return { matches, canCreate: !exact };
  }, [draft, vocabulary, value, chosen]);

  function add(raw: string) {
    // Route through the same parser the old field used, so dedupe-by-slug and
    // whitespace rules are identical — no behaviour change to the data.
    const merged = parseTagInput([...value, raw].join(","));
    onChange(merged);
    setDraft("");
  }

  return (
    <div className="flex flex-col gap-2">
      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <li key={tag}>
              <button
                type="button"
                aria-label={`Remove ${tag}`}
                onClick={() => onChange(value.filter((t) => t !== tag))}
                className="flex items-center gap-1 rounded-md border border-(--color-border) px-2 py-1 text-xs text-(--color-ink-muted) hover:text-(--color-ink)"
              >
                {tag}
                <X className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="relative">
        <Input
          value={draft}
          placeholder="Type to search your tags or create a new one"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const q = draft.trim();
              if (q) add(matches[0] ?? q);
            }
          }}
        />

        {draft.trim() && (matches.length > 0 || canCreate) ? (
          <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-(--color-border) bg-(--color-surface) shadow-sm">
            {matches.map((m) => (
              <li key={m}>
                <button
                  type="button"
                  onClick={() => add(m)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-(--color-surface-sunken)"
                >
                  <TagIcon className="size-3.5 text-(--color-ink-muted)" />
                  {m}
                </button>
              </li>
            ))}
            {canCreate ? (
              <li>
                <button
                  type="button"
                  onClick={() => add(draft.trim())}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-(--color-accent) hover:bg-(--color-surface-sunken)"
                >
                  <Plus className="size-3.5" />
                  Create &ldquo;{draft.trim()}&rdquo;
                </button>
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
