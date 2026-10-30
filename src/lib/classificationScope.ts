import type { Prisma } from "@/generated/prisma/client";
import type { Category } from "@/lib/categories";
import { hiddenByEveryone, parseHiddenCategories } from "@/lib/categoryPrefs";
import { prisma } from "@/lib/prisma";
import { sourceNamesForCategories } from "@/lib/sources/rss";

// only news from this window gets classified; anything older that the AI
// didn't reach in time is skipped for good instead of piling up
export const CLASSIFICATION_WINDOW_HOURS = 48;

export function classificationCutoff(now: Date = new Date()): Date {
  return new Date(now.getTime() - CLASSIFICATION_WINDOW_HOURS * 60 * 60 * 1000);
}

// publishedAt is the real age of the story; fetchedAt is only a fallback
// for feeds that don't send a date
function freshFilter(cutoff: Date): Prisma.ArticleWhereInput {
  return {
    OR: [{ publishedAt: { gte: cutoff } }, { publishedAt: null, fetchedAt: { gte: cutoff } }],
  };
}

// written out explicitly instead of NOT(freshFilter) — with SQL NULLs,
// NOT(...) would silently miss articles without a publishedAt
function staleFilter(cutoff: Date): Prisma.ArticleWhereInput {
  return {
    OR: [{ publishedAt: { lt: cutoff } }, { publishedAt: null, fetchedAt: { lt: cutoff } }],
  };
}

export async function getCategoriesHiddenByEveryone(): Promise<Category[]> {
  const users = await prisma.user.findMany({ select: { hiddenCategories: true } });
  return hiddenByEveryone(users.map((u) => parseHiddenCategories(u.hiddenCategories)));
}

// what the classifier will pick up next: fresh, not yet classified, not
// skipped, and not from a single-topic source nobody wants to see
export async function pendingClassificationFilter(
  now: Date = new Date(),
): Promise<Prisma.ArticleWhereInput> {
  const unwantedSources = sourceNamesForCategories(await getCategoriesHiddenByEveryone());
  return {
    AND: [
      { classifiedAt: null, classificationSkippedAt: null },
      freshFilter(classificationCutoff(now)),
      ...(unwantedSources.length > 0 ? [{ sourceName: { notIn: unwantedSources } }] : []),
    ],
  };
}

export async function skipStaleUnclassified(now: Date = new Date()): Promise<number> {
  const result = await prisma.article.updateMany({
    where: {
      AND: [
        { classifiedAt: null, classificationSkippedAt: null },
        staleFilter(classificationCutoff(now)),
      ],
    },
    data: { classificationSkippedAt: now },
  });
  return result.count;
}
