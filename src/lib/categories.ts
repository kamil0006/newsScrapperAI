import { dictionaries } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/locale";

export type Category = "AI" | "Gaming" | "Tech" | "Business" | "Science" | "Entertainment" | "Inne";

export const CATEGORIES: Category[] = [
  "AI",
  "Gaming",
  "Tech",
  "Business",
  "Science",
  "Entertainment",
  "Inne",
];

export const CATEGORY_COLOR: Record<Category, string> = {
  AI: "var(--cat-ai)",
  Gaming: "var(--cat-gaming)",
  Tech: "var(--cat-tech)",
  Business: "var(--cat-business)",
  Science: "var(--cat-science)",
  Entertainment: "var(--cat-entertainment)",
  Inne: "var(--cat-other)",
};

const KNOWN_CATEGORIES: Category[] = ["AI", "Gaming", "Tech", "Business", "Science", "Entertainment"];

export function toCategory(value: string | null | undefined): Category {
  const match = KNOWN_CATEGORIES.find((category) => category === value);
  return match ?? "Inne";
}

// the internal value (e.g. in the DB, in URL filters) stays in Polish —
// this is only the label displayed to the user
export function categoryLabel(category: Category, locale: Locale = "pl"): string {
  return dictionaries[locale].categories[category];
}
