import { redirect } from "next/navigation";
import { ChatPanel } from "@/components/ChatPanel";
import { Sidebar } from "@/components/Sidebar";
import { getAskSince } from "@/lib/askContext";
import { getCurrentUserId } from "@/lib/auth/currentUser";
import { toCategory } from "@/lib/categories";
import { parseHiddenCategories, visibleCategoriesFilter } from "@/lib/categoryPrefs";
import { visibleContentFilter } from "@/lib/contentFilter";
import { dictionaries } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/locale";
import { getNavCounts } from "@/lib/navCounts";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AskPage({ searchParams }: PageProps<"/ask">) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const params = await searchParams;
  const locale = await getLocale();
  const dict = dictionaries[locale];
  const since = getAskSince();

  const articleId = (Array.isArray(params.article) ? params.article[0] : params.article) ?? null;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { hiddenCategories: true } });
  const hiddenCategories = parseHiddenCategories(user?.hiddenCategories ?? "");

  const [counts, contextCount, focusArticleRow] = await Promise.all([
    getNavCounts(userId, hiddenCategories),
    prisma.article.count({
      where: {
        AND: [
          { classifiedAt: { not: null }, duplicateOfId: null },
          { NOT: { articleStates: { some: { userId, dismissed: true } } } },
          visibleContentFilter(),
          visibleCategoriesFilter(hiddenCategories),
          { OR: [{ publishedAt: { gte: since } }, { fetchedAt: { gte: since } }] },
        ],
      },
    }),
    articleId
      ? prisma.article.findUnique({
          where: { id: articleId },
          select: { id: true, title: true, url: true, sourceName: true, category: true },
        })
      : Promise.resolve(null),
  ]);

  const focusArticle = focusArticleRow
    ? { ...focusArticleRow, category: toCategory(focusArticleRow.category) }
    : null;

  return (
    <>
      <Sidebar active="ask" counts={counts} locale={locale} />

      <div className="flex-1 flex flex-col">
        <main className="flex-1 min-w-0 px-4 sm:px-6 py-6 flex flex-col">
          <div className="mb-6">
            <h1 className="font-serif text-2xl text-text">{dict.ask.title}</h1>
            <p className="text-sm text-text-muted mt-1">{dict.ask.subtitle}</p>
          </div>

          <ChatPanel contextCount={contextCount} focusArticle={focusArticle} locale={locale} />
        </main>
      </div>
    </>
  );
}
