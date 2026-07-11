"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Constrained multi-select — options only, no free typing (D36). Chips toggle.
 * Used for genre; reusable for any fixed-option multi-value field.
 */
export function MultiSelect({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const selected = new Set(value);
  const toggle = (opt: string) =>
    onChange(
      selected.has(opt) ? value.filter((v) => v !== opt) : [...value, opt],
    );

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const on = selected.has(opt);
        return (
          <button
            key={opt}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(opt)}
            className={cn(
              "flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs transition-colors duration-150 ease-(--ease-quiet)",
              on
                ? "border-(--color-ink) bg-(--color-ink) text-(--color-surface)"
                : "border-(--color-border) text-(--color-ink-muted) hover:text-(--color-ink)",
            )}
          >
            {on ? <Check className="size-3" /> : null}
            {opt}
          </button>
        );
      })}
    </div>
  );
}
