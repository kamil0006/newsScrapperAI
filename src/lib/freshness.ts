import type { Prisma } from "@/generated/prisma/client";

// ile dni wstecz news liczy się jako "świeży" i pokazuje na głównej liście —
// starsze znikają z widoku (ale zostają w bazie, dostępne w Zapisanych/Historii/czacie)
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
