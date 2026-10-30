import type { Prisma } from "@/generated/prisma/client";
import { CATEGORIES, type Category } from "@/lib/categories";
import { visibleCategoriesFilter } from "@/lib/categoryPrefs";
import { visibleContentFilter } from "@/lib/contentFilter";

// The main feed (homepage, category/source tabs, search) — shared by the
// list itself and the reader's "next article", so both always agree on
// what's in the list and in which order.

export type FeedFilters = { category: Category | null; source: string | null; q: string };

export const FEED_ORDER: Prisma.ArticleOrderByWithRelationInput[] = [
  { priority: "desc" },
  { publishedAt: "desc" },
];

export function parseFeedFilters(params: Record<string, string | string[] | undefined>): FeedFilters {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const rawCategory = first(params.category);
  return {
    category:
      rawCategory && (CATEGORIES as string[]).includes(rawCategory) ? (rawCategory as Category) : null,
    source: first(params.source) ?? null,
    q: first(params.q)?.trim() ?? "",
  };
}

// query string that carries the feed filters from the list into the reader
export function feedQuery(filters: FeedFilters): string {
  const params = new URLSearchParams();
  if (filters.category) params.set("category", filters.category);
  if (filters.source) params.set("source", filters.source);
  if (filters.q) params.set("q", filters.q);
  return params.toString();
}

export function mainFeedWhere({
  userId,
  filters,
  hiddenCategories,
  dateFilter,
}: {
  userId: string;
  filters: FeedFilters;
  hiddenCategories: Category[];
  dateFilter: Prisma.ArticleWhereInput;
}): Prisma.ArticleWhereInput {
  return {
    AND: [
      {
        ...(filters.category ? { category: filters.category } : {}),
        ...(filters.source ? { sourceName: filters.source } : {}),
        ...(filters.q ? { title: { contains: filters.q } } : {}),
        duplicateOfId: null,
      },
      { NOT: { articleStates: { some: { userId, dismissed: true } } } },
      // once read, an article lives on in History — the feed only surfaces
      // what's still unread
      { NOT: { articleStates: { some: { userId, read: true } } } },
      visibleContentFilter(),
      visibleCategoriesFilter(hiddenCategories),
      dateFilter,
    ],
  };
}

type Ranked = { id: string };

// what to read next: simply the top of the feed (highest priority first),
// minus the article that's open. Read articles drop out of the feed, so the
// queue moves on by itself — and an unread priority 5 never waits behind
// lower-priority articles just because a lower one was opened.
export function pickUpcoming<T extends Ranked>(current: Ranked, candidates: T[], count: number): T[] {
  return candidates.filter((c) => c.id !== current.id).slice(0, count);
}

export function pickNext<T extends Ranked>(current: Ranked, candidates: T[]): T | null {
  return pickUpcoming(current, candidates, 1)[0] ?? null;
}
