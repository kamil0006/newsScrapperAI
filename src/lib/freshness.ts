import type { Prisma } from "@/generated/prisma/client";

// how many days back a story still counts as "fresh" and shows in the main
// list — older ones drop out of view (but stay in the DB, available in
// Saved/History/chat)
export const FRESHNESS_DAYS = 7;

export function freshnessFilter(): Prisma.ArticleWhereInput {
  const since = new Date(Date.now() - FRESHNESS_DAYS * 24 * 60 * 60 * 1000);

  return {
    OR: [
      { publishedAt: { gte: since } },
      { publishedAt: null, fetchedAt: { gte: since } },
    ],
  };
}

export function getStartOfToday(): Date {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start;
}
