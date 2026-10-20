import { redirect } from "next/navigation";
import { ArticleRow } from "@/components/ArticleRow";
import { CategoryTabs } from "@/components/CategoryTabs";
import { CatchUpBanner } from "@/components/CatchUpBanner";
import { DailyBrief } from "@/components/DailyBrief";
import { EmptyState } from "@/components/EmptyState";
import { SearchBar } from "@/components/SearchBar";
import { Sidebar } from "@/components/Sidebar";
import { SourceFilter } from "@/components/SourceFilter";
import { StatsPanel } from "@/components/StatsPanel";
import { TopPicks } from "@/components/TopPicks";
import { VisitTracker } from "@/components/VisitTracker";
import { getTodaysBrief } from "@/lib/ai/brief";
import { generateCatchUpBrief } from "@/lib/ai/catchupBrief";
import { getCurrentUserId } from "@/lib/auth/currentUser";
import { CATEGORIES, toCategory, type Category } from "@/lib/categories";
import { parseHiddenCategories, visibleCategoriesFilter } from "@/lib/categoryPrefs";
import { catchUpDateFilter, getCatchUpState, sinceLabel } from "@/lib/catchup";
import { visibleContentFilter } from "@/lib/contentFilter";
import { freshnessFilter, getStartOfToday } from "@/lib/freshness";
import { dictionaries } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/locale";
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
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { hiddenCategories: true } });
  const hiddenCategories = parseHiddenCategories(user?.hiddenCategories ?? "");
  const categoryVisibility = visibleCategoriesFilter(hiddenCategories);

  const params = await searchParams;
  const locale = await getLocale();
  const dict = dictionaries[locale];
  const category = parseCategory(params.category);
  const source = (Array.isArray(params.source) ? params.source[0] : params.source) ?? null;
  const savedOnly = params.saved === "1";
  const historyOnly = params.history === "1";
  const query = (Array.isArray(params.q) ? params.q[0] : params.q)?.trim() ?? "";
  const isDefaultView = !savedOnly && !historyOnly;
  const isHomepage = isDefaultView && !category && !source && !query;

  const catchUp = isHomepage
    ? await getCatchUpState(userId)
    : { isCatchUp: false, since: null, hoursAway: 0 };

  const filters: ArticleFilters = {
    category,
    source,
    saved: savedOnly,
    history: historyOnly,
    q: query,
  };

  const notDismissedByUser: Prisma.ArticleWhereInput = {
    NOT: { articleStates: { some: { userId, dismissed: true } } },
  };

  const startOfToday = getStartOfToday();
  const statsDateFilter = catchUp.isCatchUp && catchUp.since ? catchUpDateFilter(catchUp.since) : freshnessFilter();

  // "History" needs to be ordered by this user's readAt, which only exists
  // on ArticleState — Prisma can't order a to-many relation's filtered field
  // from the parent model, so it's queried from ArticleState as the root.
  // Either way, `rowsPromise` resolves to { article, read, saved }[] so the
  // mapping below doesn't need to care which path produced it.
  const rowsPromise = historyOnly
    ? prisma.articleState
        .findMany({
          where: {
            userId,
            read: true,
            dismissed: false,
            article: {
              AND: [
                {
                  ...(category ? { category } : {}),
                  ...(source ? { sourceName: source } : {}),
                  ...(query ? { title: { contains: query } } : {}),
                },
                visibleContentFilter(),
                categoryVisibility,
              ],
            },
          },
          orderBy: { readAt: "desc" },
          take: 50,
          include: { article: true },
        })
        .then((states) => states.map((s) => ({ article: s.article, read: s.read, saved: s.saved })))
    : prisma.article
        .findMany({
          where: {
            AND: [
              {
                ...(category ? { category } : {}),
                ...(source ? { sourceName: source } : {}),
                ...(query ? { title: { contains: query } } : {}),
                ...(savedOnly ? { articleStates: { some: { userId, saved: true } } } : {}),
                // duplicates are hidden only in the main view — Saved shows
                // exactly what you actually saved
                ...(isDefaultView ? { duplicateOfId: null } : {}),
              },
              notDismissedByUser,
              visibleContentFilter(),
              categoryVisibility,
              // old news only disappears from the main view; in "catch-up"
              // mode the window stretches to cover the whole absence
              // instead of a fixed 7 days
              ...(isDefaultView ? [statsDateFilter] : []),
            ],
          },
          orderBy: [{ priority: "desc" }, { publishedAt: "desc" }],
          take: 50,
          include: { articleStates: { where: { userId } } },
        })
        .then((rows) =>
          rows.map(({ articleStates, ...article }) => ({
            article,
            read: articleStates[0]?.read ?? false,
            saved: articleStates[0]?.saved ?? false,
          })),
        );

  const [rows, counts, brief, newToday, mustRead, pendingClassification, sourceRows] = await Promise.all([
    rowsPromise,
    getNavCounts(userId, hiddenCategories, isHomepage ? statsDateFilter : undefined),
    catchUp.isCatchUp && catchUp.since
      ? generateCatchUpBrief(userId, catchUp.since, locale, hiddenCategories)
      : isHomepage
        ? getTodaysBrief()
        : Promise.resolve(null),
    prisma.article.count({
      where: {
        AND: [
          { fetchedAt: { gte: startOfToday } },
          notDismissedByUser,
          { duplicateOfId: null },
          visibleContentFilter(),
          categoryVisibility,
        ],
      },
    }),
    prisma.article.count({
      where: {
        AND: [
          { priority: 5, duplicateOfId: null },
          { NOT: { articleStates: { some: { userId, OR: [{ read: true }, { dismissed: true }] } } } },
          visibleContentFilter(),
          categoryVisibility,
          statsDateFilter,
        ],
      },
    }),
    prisma.article.count({ where: { AND: [{ classifiedAt: null }, notDismissedByUser] } }),
    prisma.article.findMany({
      distinct: ["sourceName"],
      select: { sourceName: true },
      orderBy: { sourceName: "asc" },
    }),
  ]);

  const sources = sourceRows.map((row) => row.sourceName);

  const threadIds = [...new Set(rows.map((r) => r.article.threadId).filter((id) => id !== null))];
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

  const articles: ArticleListItem[] = rows.map(({ article, read, saved }) => ({
    id: article.id,
    url: article.url,
    title: article.title,
    summary: article.summary,
    sourceName: article.sourceName,
    category: toCategory(article.category),
    priority: article.priority,
    publishedAt: article.publishedAt,
    read,
    saved,
    consensusSources: article.consensusSources,
    qualityLabel: article.qualityLabel,
    qualityNote: article.qualityNote,
    threadId: article.threadId,
    threadCount: article.threadId ? (threadCountMap.get(article.threadId) ?? 1) : 1,
  }));

  const TOP_PICKS_LIMIT = 5;
  const topPicks = isHomepage
    ? articles.filter((a) => !a.read && (a.priority ?? 0) >= 4).slice(0, TOP_PICKS_LIMIT)
    : [];

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
      <Sidebar active={activeNav} counts={counts} locale={locale} />

      <div className="flex-1 flex flex-col lg:flex-row">
        <main className="flex-1 min-w-0 px-4 sm:px-6 py-6">
          <div className="mb-6">
            <h1 className="font-serif text-2xl text-text">
              {historyOnly ? dict.home.titleHistory : savedOnly ? dict.home.titleSaved : dict.home.title}
            </h1>
            <p className="text-sm text-text-muted mt-1">
              {historyOnly ? dict.home.subtitleHistory : dict.home.subtitleDefault}
            </p>
          </div>

          {brief && catchUp.isCatchUp ? (
            <CatchUpBanner content={brief} since={sinceLabel(catchUp.hoursAway, locale)} locale={locale} />
          ) : (
            brief && <DailyBrief content={brief} locale={locale} />
          )}

          <TopPicks items={topPicks} locale={locale} />

          <SearchBar filters={filters} locale={locale} />

          <div className="mb-5 flex items-center justify-between gap-3 flex-wrap">
            <CategoryTabs filters={filters} hiddenCategories={hiddenCategories} locale={locale} />
            <SourceFilter sources={sources} filters={filters} locale={locale} />
          </div>

          {articles.length === 0 ? (
            <EmptyState variant={emptyVariant} query={query} locale={locale} />
          ) : (
            <div className="space-y-3">
              {articles.map((article) => (
                <ArticleRow key={article.id} article={article} locale={locale} />
              ))}
            </div>
          )}
        </main>

        <aside className="w-full lg:w-72 shrink-0 px-4 sm:px-6 lg:pr-6 pb-6 lg:py-6">
          <StatsPanel
            newToday={newToday}
            mustRead={mustRead}
            pendingClassification={pendingClassification}
            locale={locale}
          />
        </aside>
      </div>
    </>
  );
}
