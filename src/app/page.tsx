import { ArticleRow } from "@/components/ArticleRow";
import { CategoryTabs } from "@/components/CategoryTabs";
import { CatchUpBanner } from "@/components/CatchUpBanner";
import { DailyBrief } from "@/components/DailyBrief";
import { EmptyState } from "@/components/EmptyState";
import { SearchBar } from "@/components/SearchBar";
import { Sidebar } from "@/components/Sidebar";
import { SourceFilter } from "@/components/SourceFilter";
import { StatsPanel } from "@/components/StatsPanel";
import { VisitTracker } from "@/components/VisitTracker";
import { getTodaysBrief } from "@/lib/ai/brief";
import { generateCatchUpBrief } from "@/lib/ai/catchupBrief";
import { CATEGORIES, toCategory, type Category } from "@/lib/categories";
import { catchUpDateFilter, getCatchUpState, sinceLabel } from "@/lib/catchup";
import { visibleContentFilter } from "@/lib/contentFilter";
import { freshnessFilter, getStartOfToday } from "@/lib/freshness";
import { getNavCounts } from "@/lib/navCounts";
import { prisma } from "@/lib/prisma";
import type { ArticleFilters } from "@/lib/queryParams";
import type { ArticleListItem } from "@/lib/types";
import type { Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

function parseCategory(value: string | string[] | undefined): Category | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && (CATEGORIES as string[]).includes(raw) ? (raw as Category) : null;
}

export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const category = parseCategory(params.category);
  const source = (Array.isArray(params.source) ? params.source[0] : params.source) ?? null;
  const savedOnly = params.saved === "1";
  const historyOnly = params.history === "1";
  const query = (Array.isArray(params.q) ? params.q[0] : params.q)?.trim() ?? "";
  const isDefaultView = !savedOnly && !historyOnly;
  const isHomepage = isDefaultView && !category && !source && !query;

  const catchUp = isHomepage
    ? await getCatchUpState()
    : { isCatchUp: false, since: null, hoursAway: 0 };

  const filters: ArticleFilters = {
    category,
    source,
    saved: savedOnly,
    history: historyOnly,
    q: query,
  };

  const where: Prisma.ArticleWhereInput = {
    AND: [
      {
        ...(category ? { category } : {}),
        ...(source ? { sourceName: source } : {}),
        ...(savedOnly ? { saved: true } : {}),
        ...(historyOnly ? { read: true } : {}),
        ...(query ? { title: { contains: query } } : {}),
        // „nieistotne” to bezpośrednia akcja użytkownika — chowamy wszędzie
        dismissed: false,
        // duplikaty chowamy tylko w głównym widoku — Zapisane/Historia
        // pokazują to, co realnie zapisałeś/otworzyłeś
        ...(isDefaultView ? { duplicateOfId: null } : {}),
      },
      // sponsoring/promo i obcy język — twarde filtry, wszędzie
      visibleContentFilter(),
      // stare newsy znikają tylko z głównego widoku; w trybie "dogoń się"
      // okno rozciąga się na całą nieobecność zamiast stałych 7 dni
      ...(isDefaultView
        ? [catchUp.isCatchUp && catchUp.since ? catchUpDateFilter(catchUp.since) : freshnessFilter()]
        : []),
    ],
  };

  const orderBy: Prisma.ArticleOrderByWithRelationInput[] = historyOnly
    ? [{ readAt: "desc" }]
    : [{ priority: "desc" }, { publishedAt: "desc" }];

  const startOfToday = getStartOfToday();

  const [rows, counts, brief, newToday, mustRead, pendingClassification, sourceRows] =
    await Promise.all([
      prisma.article.findMany({ where, orderBy, take: 50 }),
      getNavCounts(
        catchUp.isCatchUp && catchUp.since ? catchUpDateFilter(catchUp.since) : undefined,
      ),
      catchUp.isCatchUp && catchUp.since
        ? generateCatchUpBrief(catchUp.since)
        : isHomepage
          ? getTodaysBrief()
          : Promise.resolve(null),
      prisma.article.count({
        where: {
          fetchedAt: { gte: startOfToday },
          dismissed: false,
          duplicateOfId: null,
          ...visibleContentFilter(),
        },
      }),
      prisma.article.count({
        where: {
          priority: 5,
          read: false,
          dismissed: false,
          duplicateOfId: null,
          ...visibleContentFilter(),
        },
      }),
      prisma.article.count({ where: { classifiedAt: null, dismissed: false } }),
      prisma.article.findMany({
        distinct: ["sourceName"],
        select: { sourceName: true },
        orderBy: { sourceName: "asc" },
      }),
    ]);

  const sources = sourceRows.map((row) => row.sourceName);

  const threadIds = [...new Set(rows.map((r) => r.threadId).filter((id) => id !== null))];
  const threadCounts =
    threadIds.length > 0
      ? await prisma.article.groupBy({
          by: ["threadId"],
          where: { threadId: { in: threadIds } },
          _count: { _all: true },
        })
      : [];
  const threadCountMap = new Map(
    threadCounts.map((t) => [t.threadId as string, t._count._all]),
  );

  const articles: ArticleListItem[] = rows.map((row) => ({
    id: row.id,
    url: row.url,
    title: row.title,
    summary: row.summary,
    sourceName: row.sourceName,
    category: toCategory(row.category),
    priority: row.priority,
    publishedAt: row.publishedAt,
    read: row.read,
    saved: row.saved,
    consensusSources: row.consensusSources,
    qualityLabel: row.qualityLabel,
    qualityNote: row.qualityNote,
    threadId: row.threadId,
    threadCount: row.threadId ? (threadCountMap.get(row.threadId) ?? 1) : 1,
  }));

  const activeNav = historyOnly ? "history" : savedOnly ? "saved" : "all";
  const emptyVariant = query
    ? "search"
    : historyOnly
      ? "history"
      : savedOnly
        ? "saved"
        : "all";

  return (
    <>
      <VisitTracker />
      <Sidebar active={activeNav} counts={counts} />

      <div className="flex-1 flex flex-col lg:flex-row">
        <main className="flex-1 min-w-0 px-4 sm:px-6 py-6">
          <div className="mb-6">
            <h1 className="font-serif text-2xl text-text">
              {historyOnly
                ? "Historia"
                : savedOnly
                  ? "Zapisane"
                  : "Dzisiejsze newsy"}
            </h1>
            <p className="text-sm text-text-muted mt-1">
              {historyOnly
                ? "Wszystko, co otworzyłeś — niezależnie od tego, czy zostało zapisane."
                : "Wyselekcjonowane przez AI. Posortowane wg tego, co warto przeczytać."}
            </p>
          </div>

          {brief && catchUp.isCatchUp ? (
            <CatchUpBanner content={brief} since={sinceLabel(catchUp.hoursAway)} />
          ) : (
            brief && <DailyBrief content={brief} />
          )}

          <SearchBar filters={filters} />

          <div className="mb-5 flex items-center justify-between gap-3 flex-wrap">
            <CategoryTabs filters={filters} />
            <SourceFilter sources={sources} filters={filters} />
          </div>

          {articles.length === 0 ? (
            <EmptyState variant={emptyVariant} query={query} />
          ) : (
            <div className="space-y-3">
              {articles.map((article) => (
                <ArticleRow key={article.id} article={article} />
              ))}
            </div>
          )}
        </main>

        <aside className="w-full lg:w-72 shrink-0 px-4 sm:px-6 lg:pr-6 pb-6 lg:py-6">
          <StatsPanel
            newToday={newToday}
            mustRead={mustRead}
            pendingClassification={pendingClassification}
          />
        </aside>
      </div>
    </>
  );
}
