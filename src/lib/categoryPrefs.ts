import { CATEGORIES, type Category } from "@/lib/categories";
import type { Prisma } from "@/generated/prisma/client";

export function parseHiddenCategories(raw: string): Category[] {
  if (!raw) return [];
  const known = new Set<string>(CATEGORIES);
  return raw.split(",").filter((c): c is Category => known.has(c));
}

export function serializeHiddenCategories(categories: Category[]): string {
  return categories.join(",");
}

// unclassified articles (category: null) always stay visible — they aren't
// "in" any hidden category yet, they're just pending
export function visibleCategoriesFilter(hidden: Category[]): Prisma.ArticleWhereInput {
  if (hidden.length === 0) return {};
  return { OR: [{ category: null }, { category: { notIn: hidden } }] };
}

// categories that every account hides — nobody would ever see them, so
// there's no point fetching or classifying single-topic sources for them.
// With no accounts at all, nothing counts as hidden.
export function hiddenByEveryone(perUser: Category[][]): Category[] {
  if (perUser.length === 0) return [];
  const [first, ...rest] = perUser;
  return first.filter((category) => rest.every((hidden) => hidden.includes(category)));
}
