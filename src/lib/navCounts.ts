import { visibleContentFilter } from "@/lib/contentFilter";
import { freshnessFilter } from "@/lib/freshness";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export async function getNavCounts(allDateFilter?: Prisma.ArticleWhereInput) {
  const [all, saved, history] = await Promise.all([
    prisma.article.count({
      where: {
        AND: [
          { duplicateOfId: null, dismissed: false },
          visibleContentFilter(),
          allDateFilter ?? freshnessFilter(),
        ],
      },
    }),
    prisma.article.count({
      where: { saved: true, dismissed: false, ...visibleContentFilter() },
    }),
    prisma.article.count({
      where: { read: true, dismissed: false, ...visibleContentFilter() },
    }),
  ]);

  return { all, saved, history };
}
