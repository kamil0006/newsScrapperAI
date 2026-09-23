import { visibleContentFilter } from "@/lib/contentFilter";
import { prisma } from "@/lib/prisma";
import { jaccardSimilarity, textWords } from "@/lib/textSimilarity";

// dwa niezależne sygnały, bo żaden sam nie wystarcza: te same wydarzenie
// bywa opisane bardzo podobnym tytułem (np. recenzje tej samej gry) ALBO
// zupełnie różnym tytułem, ale zbieżnym streszczeniem AI (parafraza newsa)
const TITLE_THRESHOLD = 0.35;
const SUMMARY_THRESHOLD = 0.35;
const LOOKBACK_DAYS = 5;

type Candidate = {
  id: string;
  titleWords: Set<string>;
  summaryWords: Set<string>;
  category: string | null;
  sourceName: string;
};

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

    // różne konkretne portale (nie tylko różny typ źródła — dwa różne
    // feedy RSS to wciąż dwa niezależne źródła) i ta sama kategoria AI
    const match = kept.find((k) => {
      if (k.sourceName === candidate.sourceName || k.category !== candidate.category) {
        return false;
      }
      const titleSim = jaccardSimilarity(k.titleWords, candidate.titleWords);
      const summarySim = jaccardSimilarity(k.summaryWords, candidate.summaryWords);
      return titleSim >= TITLE_THRESHOLD || summarySim >= SUMMARY_THRESHOLD;
    });

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

      // pierwsze potwierdzenie z niezależnego źródła — jednorazowy boost
      // priorytetu; kolejne duplikaty tylko podbijają licznik, nie priorytet
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
