export type Trigger = {
  label: string;
  category: string;
  intensity: number;
};

const clamp = (n: number) => Math.min(5, Math.max(1, Math.round(n || 1)));

/**
 * Normalizes model-extracted triggers: lowercases categories and clamps
 * intensity to 1-5 so inserts satisfy the DB CHECK constraint.
 */
export function normalizeTriggers(raw: Trigger[] | undefined): Trigger[] {
  return (raw ?? []).map((t) => ({
    label: t.label,
    category: t.category?.toLowerCase() ?? "other",
    intensity: clamp(t.intensity),
  }));
}
