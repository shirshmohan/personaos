"use client";

import { useState } from "react";
import { Palette } from "lucide-react";
import { THEMES, THEME_COOKIE, type ThemeId } from "@/features/theme/themes";

export function ThemeSwitcher({ current }: { current: ThemeId }) {
  const [active, setActive] = useState<ThemeId>(current);
  const [open, setOpen] = useState(false);

  function pick(id: ThemeId) {
    setActive(id);
    setOpen(false);
    document.documentElement.setAttribute("data-theme", id);
    // 1-year cookie; server reads it on next load so there's no flash.
    document.cookie = `${THEME_COOKIE}=${id}; path=/; max-age=31536000; samesite=lax`;
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Change theme"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex size-8 items-center justify-center rounded-md text-(--color-ink-muted) transition-colors hover:text-(--color-ink)"
      >
        <Palette className="size-4" />
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 flex flex-col gap-0.5 rounded-lg border border-(--color-border) bg-(--color-surface) p-1 shadow-lg">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => pick(t.id)}
                className={[
                  "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-sm whitespace-nowrap transition-colors",
                  active === t.id
                    ? "bg-(--color-surface-sunken)"
                    : "hover:bg-(--color-surface-sunken)",
                ].join(" ")}
              >
                <span
                  className="inline-block size-3.5 rounded-full ring-1 ring-(--color-border)"
                  style={{ backgroundColor: t.swatch }}
                />
                {t.label}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
