import type { Prisma } from "@/generated/prisma/client";
import type { Category } from "@/lib/categories";
import { visibleContentFilter } from "@/lib/contentFilter";
import { FEED_ORDER, type FeedFilters, mainFeedWhere, pickUpcoming } from "@/lib/feed";
import { freshnessFilter } from "@/lib/freshness";
import { prisma } from "@/lib/prisma";

const MAX_RELATED = 6;
// "next" plus a few more behind the expandable list
const UPCOMING_COUNT = 5;

const cardSelect = {
  id: true,
  title: true,
  summary: true,
  sourceName: true,
  category: true,
  priority: true,
  publishedAt: true,
} satisfies Prisma.ArticleSelect;

export type ReaderCard = Prisma.ArticleGetPayload<{ select: typeof cardSelect }>;

// the next unread articles of the list the reader was opened from — [0] is
// "next", the rest go into the expandable list
export async function getUpcomingArticles({
  userId,
  current,
  filters,
  hiddenCategories,
}: {
  userId: string;
  current: { id: string };
  filters: FeedFilters;
  hiddenCategories: Category[];
}): Promise<ReaderCard[]> {
  const candidates = await prisma.article.findMany({
    where: mainFeedWhere({ userId, filters, hiddenCategories, dateFilter: freshnessFilter() }),
    orderBy: FEED_ORDER,
    // +1 in case the open article is still in the feed (not marked read yet)
    take: UPCOMING_COUNT + 1,
    select: cardSelect,
  });
  return pickUpcoming(current, candidates, UPCOMING_COUNT);
}

export type RelatedItem = {
  id: string;
  title: string;
  sourceName: string;
  publishedAt: Date | null;
  read: boolean;
};

// other coverage of the same story: articles in the same thread, plus
// duplicates from other sources (either way round)
export async function getRelatedArticles({
  userId,
  current,
}: {
  userId: string;
  current: { id: string; threadId: string | null; duplicateOfId: string | null };
}): Promise<RelatedItem[]> {
  const sameStory: Prisma.ArticleWhereInput[] = [{ duplicateOfId: current.id }];
  if (current.threadId) sameStory.push({ threadId: current.threadId });
  if (current.duplicateOfId) {
    sameStory.push({ id: current.duplicateOfId }, { duplicateOfId: current.duplicateOfId });
  }

  const rows = await prisma.article.findMany({
    where: {
      AND: [
        { id: { not: current.id }, OR: sameStory },
        { NOT: { articleStates: { some: { userId, dismissed: true } } } },
        visibleContentFilter(),
      ],
    },
    orderBy: { publishedAt: "desc" },
    take: MAX_RELATED,
    select: {
      id: true,
      title: true,
      sourceName: true,
      publishedAt: true,
      articleStates: { where: { userId }, select: { read: true } },
    },
  });

  return rows.map(({ articleStates, ...row }) => ({ ...row, read: articleStates[0]?.read ?? false }));
}
