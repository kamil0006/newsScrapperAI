export type Category = "AI" | "Gaming" | "Tech" | "Inne";

export const CATEGORIES: Category[] = ["AI", "Gaming", "Tech", "Inne"];

export const CATEGORY_COLOR: Record<Category, string> = {
  AI: "var(--cat-ai)",
  Gaming: "var(--cat-gaming)",
  Tech: "var(--cat-tech)",
  Inne: "var(--cat-other)",
};

export function toCategory(value: string | null | undefined): Category {
  if (value === "AI" || value === "Gaming" || value === "Tech") return value;
  return "Inne";
}
