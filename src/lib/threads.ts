import { visibleContentFilter } from "@/lib/contentFilter";
import { prisma } from "@/lib/prisma";
import { jaccardSimilarity, textWords } from "@/lib/textSimilarity";

// lower threshold than for duplicates — we want to catch "the next chapter
// of the same story", not just near-identical coverage from the same day
const THREAD_THRESHOLD = 0.25;
const LOOKBACK_DAYS = 14;
const MIN_WORDS = 4;

type Candidate = {
  id: string;
  titleWords: Set<string>;
  summaryWords: Set<string>;
  category: string | null;
  threadId: string | null;
};

export async function linkThreads(): Promise<{ linked: number }> {
  const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  const rows = await prisma.article.findMany({
    where: {
      AND: [
        {
          classifiedAt: { not: null },
          duplicateOfId: null,
          // "Inne" is a catch-all category for unrelated content (coupons,
          // templated posts) — it over-generates false threads
          category: { not: "Inne" },
        },
        visibleContentFilter(),
        { OR: [{ publishedAt: { gte: since } }, { publishedAt: null }] },
      ],
    },
    select: {
      id: true,
      title: true,
      summary: true,
      category: true,
      threadId: true,
    },
    orderBy: { fetchedAt: "asc" },
  });

  const kept: Candidate[] = [];
  let linked = 0;

  for (const row of rows) {
    const candidate: Candidate = {
      id: row.id,
      titleWords: textWords(row.title),
      summaryWords: textWords(row.summary ?? ""),
      category: row.category,
      threadId: row.threadId,
    };

    if (!candidate.threadId) {
      const match = kept.find((k) => {
        if (k.category !== candidate.category) return false;
        if (k.titleWords.size < MIN_WORDS || candidate.titleWords.size < MIN_WORDS) {
          return false;
        }
        const titleSim = jaccardSimilarity(k.titleWords, candidate.titleWords);
        const summarySim = jaccardSimilarity(k.summaryWords, candidate.summaryWords);
        return titleSim >= THREAD_THRESHOLD || summarySim >= THREAD_THRESHOLD;
      });

      if (match) {
        const threadId = match.threadId ?? match.id;

        if (!match.threadId) {
          await prisma.article.update({
            where: { id: match.id },
            data: { threadId: match.id },
          });
          match.threadId = match.id;
        }

        await prisma.article.update({
          where: { id: candidate.id },
          data: { threadId },
        });
        candidate.threadId = threadId;
        linked += 1;
      }
    }

    kept.push(candidate);
  }

  return { linked };
}
