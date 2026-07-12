export const THEMES = [
  { id: "paper", label: "Paper", swatch: "oklch(99% 0.002 264)", dark: false },
  { id: "ink", label: "Ink", swatch: "oklch(18% 0.006 264)", dark: true },
  { id: "slate", label: "Slate", swatch: "oklch(22% 0.02 250)", dark: true },
  { id: "cream", label: "Cream", swatch: "oklch(96% 0.018 80)", dark: false },
  { id: "midnight", label: "Midnight", swatch: "oklch(20% 0.03 265)", dark: true },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];
export const DEFAULT_THEME: ThemeId = "paper";
export const THEME_COOKIE = "persona-theme";

export function isTheme(v: string | undefined): v is ThemeId {
  return !!v && THEMES.some((t) => t.id === v);
}
