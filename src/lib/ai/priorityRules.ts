export type QualityLabel = "rzetelny" | "przeciętny" | "lanie_wody";

export function clampPriority(value: number): number {
  return Math.min(5, Math.max(1, Math.round(value)));
}

// fluff shouldn't be "must read" regardless of topic
export function applyQualityClamp(
  priority: number,
  quality: QualityLabel | null,
): number {
  return quality === "lanie_wody" ? Math.min(priority, 2) : priority;
}
