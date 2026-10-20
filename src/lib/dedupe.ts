import { visibleContentFilter } from "@/lib/contentFilter";
import { prisma } from "@/lib/prisma";
import { jaccardSimilarity, textWords } from "@/lib/textSimilarity";

// two independent signals, since neither alone is enough: the same event
// might be covered with a very similar title (e.g. reviews of the same
// game) OR a completely different title but a matching AI summary (a
// paraphrased story)
const TITLE_THRESHOLD = 0.35;
const SUMMARY_THRESHOLD = 0.35;
const LOOKBACK_DAYS = 5;

export type Candidate = {
  id: string;
  titleWords: Set<string>;
  summaryWords: Set<string>;
  category: string | null;
  sourceName: string;
};

// extracted as a pure function (no DB access) — this is where a bug once
// confused sourceType with sourceName, so this spot is covered by tests
export function isDuplicateMatch(a: Candidate, b: Candidate): boolean {
  if (a.sourceName === b.sourceName || a.category !== b.category) return false;

  const titleSim = jaccardSimilarity(a.titleWords, b.titleWords);
  const summarySim = jaccardSimilarity(a.summaryWords, b.summaryWords);
  return titleSim >= TITLE_THRESHOLD || summarySim >= SUMMARY_THRESHOLD;
}

export async function markDuplicates(): Promise<{ marked: number; boosted: number }> {
  const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  const rows = await prisma.article.findMany({
    where: {
      AND: [
        { classifiedAt: { not: null } },
        visibleContentFilter(),
        { OR: [{ publishedAt: { gte: since } }, { publishedAt: null }] },
      ],
    },
    select: {
      id: true,
      title: true,
      summary: true,
      category: true,
      sourceName: true,
      duplicateOfId: true,
    },
    orderBy: { fetchedAt: "asc" },
  });

  const kept: Candidate[] = [];
  let marked = 0;
  let boosted = 0;

  for (const row of rows) {
    if (row.duplicateOfId) continue;

    const candidate: Candidate = {
      id: row.id,
      titleWords: textWords(row.title),
      summaryWords: textWords(row.summary ?? ""),
      category: row.category,
      sourceName: row.sourceName,
    };

    const match = kept.find((k) => isDuplicateMatch(k, candidate));

    if (match) {
      await prisma.article.update({
        where: { id: candidate.id },
        data: { duplicateOfId: match.id },
      });
      marked += 1;

      const canonical = await prisma.article.update({
        where: { id: match.id },
        data: { consensusSources: { increment: 1 } },
      });

      // first confirmation from an independent source — a one-time priority
      // boost; further duplicates only bump the counter, not the priority
      if (canonical.consensusSources === 2 && canonical.priority !== null) {
        await prisma.article.update({
          where: { id: match.id },
          data: { priority: Math.min(5, canonical.priority + 1) },
        });
        boosted += 1;
      }
    } else {
      kept.push(candidate);
    }
  }

  return { marked, boosted };
}
