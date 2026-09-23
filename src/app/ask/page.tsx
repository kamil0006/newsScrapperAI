import { ChatPanel } from "@/components/ChatPanel";
import { Sidebar } from "@/components/Sidebar";
import { getAskSince } from "@/lib/askContext";
import { visibleContentFilter } from "@/lib/contentFilter";
import { getNavCounts } from "@/lib/navCounts";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const SUGGESTIONS = [
  "Co najważniejszego wydarzyło się dziś w AI?",
  "Podsumuj najciekawsze newsy o grach z tego tygodnia",
  "Czy było coś o nowych modelach open source?",
  "Co warto przeczytać, a co mogę spokojnie pominąć?",
];

export default async function AskPage() {
  const since = getAskSince();

  const [counts, contextCount] = await Promise.all([
    getNavCounts(),
    prisma.article.count({
      where: {
        AND: [
          { classifiedAt: { not: null }, duplicateOfId: null, dismissed: false },
          visibleContentFilter(),
          { OR: [{ publishedAt: { gte: since } }, { fetchedAt: { gte: since } }] },
        ],
      },
    }),
  ]);

  return (
    <>
      <Sidebar active="ask" counts={counts} />

      <div className="flex-1 flex flex-col">
        <main className="flex-1 min-w-0 px-4 sm:px-6 py-6 flex flex-col">
          <div className="mb-6">
            <h1 className="font-serif text-2xl text-text">Zapytaj AI</h1>
            <p className="text-sm text-text-muted mt-1">
              Odpowiada wyłącznie na podstawie newsów, które już masz w bazie —
              bez wychodzenia do internetu.
            </p>
          </div>

          <ChatPanel contextCount={contextCount} suggestions={SUGGESTIONS} />
        </main>
      </div>
    </>
  );
}
