/**
 * Tier identities (D34 + gamified Library direction). Each tier gets a colour
 * so the ranking reads at a glance — the whole point of a tier list. Colours
 * are scoped to Library only; the rest of the site stays quiet (D38).
 *
 * Values are OKLCH so they sit tonally with the ink/surface system rather than
 * screaming. S is gold, descending to a muted grey F.
 */
export const TIER_ORDER = ["S", "A", "B", "C", "D", "F"] as const;
export type Tier = (typeof TIER_ORDER)[number];

export interface TierStyle {
  label: Tier;
  /** Accent for the letter + rail. */
  color: string;
  /** Faint wash behind the row. */
  wash: string;
}

export const TIER_STYLES: Record<Tier, TierStyle> = {
  S: { label: "S", color: "oklch(76% 0.14 85)",  wash: "oklch(76% 0.14 85 / 0.08)" },  // gold
  A: { label: "A", color: "oklch(70% 0.15 150)", wash: "oklch(70% 0.15 150 / 0.08)" }, // green
  B: { label: "B", color: "oklch(68% 0.13 230)", wash: "oklch(68% 0.13 230 / 0.08)" }, // blue
  C: { label: "C", color: "oklch(72% 0.13 300)", wash: "oklch(72% 0.13 300 / 0.07)" }, // violet
  D: { label: "D", color: "oklch(68% 0.10 40)",  wash: "oklch(68% 0.10 40 / 0.07)" },  // clay
  F: { label: "F", color: "oklch(60% 0.02 260)", wash: "oklch(60% 0.02 260 / 0.06)" }, // grey
};

export function tierStyle(tier: string | null | undefined): TierStyle | null {
  if (tier && tier in TIER_STYLES) return TIER_STYLES[tier as Tier];
  return null;
}
