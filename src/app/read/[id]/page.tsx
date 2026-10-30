import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { CategoryDot } from "@/components/CategoryDot";
import { DiscussLink } from "@/components/DiscussLink";
import { MarkReadOnMount } from "@/components/MarkReadOnMount";
import { PriorityBadge } from "@/components/PriorityBadge";
import { KeyPointsSkeleton, ReaderTextSkeleton } from "@/components/ReaderBodySkeleton";
import { ReaderKeyPoints } from "@/components/ReaderKeyPoints";
import { ReaderNext } from "@/components/ReaderNext";
import { ReaderRelated } from "@/components/ReaderRelated";
import { ReaderText } from "@/components/ReaderText";
import { SaveToggle } from "@/components/SaveToggle";
import { Sidebar } from "@/components/Sidebar";
import { getCurrentUserId } from "@/lib/auth/currentUser";
import { toCategory } from "@/lib/categories";
import { parseHiddenCategories } from "@/lib/categoryPrefs";
import { feedQuery, parseFeedFilters } from "@/lib/feed";
import { relativeTime } from "@/lib/format";
import { dictionaries } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/locale";
import { getNavCounts } from "@/lib/navCounts";
import { prisma } from "@/lib/prisma";
import { getRelatedArticles, getUpcomingArticles } from "@/lib/readerNav";
import { getTheme } from "@/lib/theme";

export const dynamic = "force-dynamic";

export default async function ReaderPage({ params, searchParams }: PageProps<"/read/[id]">) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const { id } = await params;
  // the list's filters ride along in the URL, so "next" and "back" stay in
  // the same category/source/search the reader was opened from
  const filters = parseFeedFilters(await searchParams);
  const query = feedQuery(filters);
  const listHref = query ? `/?${query}` : "/";

  const locale = await getLocale();
  const theme = await getTheme();
  const dict = dictionaries[locale];

  const [article, user] = await Promise.all([
    prisma.article.findUnique({
      where: { id },
      select: {
        id: true,
        url: true,
        title: true,
        summary: true,
        sourceName: true,
        category: true,
        priority: true,
        publishedAt: true,
        threadId: true,
        duplicateOfId: true,
        articleStates: { where: { userId }, select: { read: true, saved: true } },
      },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { hiddenCategories: true } }),
  ]);
  if (!article) notFound();

  const hiddenCategories = parseHiddenCategories(user?.hiddenCategories ?? "");
  const [counts, upcoming, related] = await Promise.all([
    getNavCounts(userId, hiddenCategories),
    getUpcomingArticles({ userId, current: article, filters, hiddenCategories }),
    getRelatedArticles({ userId, current: article }),
  ]);
  const state = article.articleStates[0];

  const sidePanel = (
    <>
      <ReaderNext upcoming={upcoming} query={query} listHref={listHref} locale={locale} />
      <ReaderRelated items={related} query={query} locale={locale} />
    </>
  );

  return (
    <>
      <Sidebar active="all" counts={counts} locale={locale} theme={theme} />
      <MarkReadOnMount articleId={article.id} alreadyRead={state?.read ?? false} />

      <div className="flex-1 min-w-0 flex flex-col xl:flex-row xl:gap-8">
        <main className="min-w-0 px-4 sm:px-6 py-6 w-full max-w-2xl">
          <Link href={listHref} className="text-sm text-text-muted hover:text-text transition-colors">
            {dict.reader.back}
          </Link>

          <header className="mt-5 mb-7">
            <div className="flex items-center gap-3 flex-wrap">
              <PriorityBadge priority={article.priority} locale={locale} />
              <CategoryDot category={toCategory(article.category)} locale={locale} />
              <span className="text-xs text-text-faint">{article.sourceName}</span>
              <span className="text-xs text-text-faint">
                {relativeTime(article.publishedAt, locale)}
              </span>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl leading-tight text-text mt-3">
              {article.title}
            </h1>

            <div className="flex items-center gap-4 mt-4">
              <SaveToggle articleId={article.id} initialSaved={state?.saved ?? false} locale={locale} />
              <DiscussLink articleId={article.id} locale={locale} />
              <a
                href={article.url}
                target="_blank"
                rel="noreferrer"
                className="ml-auto text-sm font-medium px-3 py-1.5 rounded-md border border-border text-text-muted hover:text-text hover:border-text-faint transition-colors"
              >
                {dict.reader.openOriginal} ↗
              </a>
            </div>
          </header>

          {/* two boundaries: the text streams in first, AI key points after */}
          <Suspense fallback={<KeyPointsSkeleton label={dict.reader.loading} />}>
            <ReaderKeyPoints articleId={article.id} summary={article.summary} locale={locale} />
          </Suspense>
          <Suspense fallback={<ReaderTextSkeleton />}>
            <ReaderText articleId={article.id} url={article.url} locale={locale} />
          </Suspense>

          {/* narrower screens: next/related sit under the article instead of beside it */}
          <div className="xl:hidden mt-10 space-y-4">{sidePanel}</div>

          <div className="mt-10 pt-5 border-t border-border flex items-center justify-between gap-3">
            <Link href={listHref} className="text-sm text-text-muted hover:text-text transition-colors">
              {dict.reader.back}
            </Link>
            <a
              href={article.url}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-text-muted hover:text-text transition-colors"
            >
              {dict.reader.openOriginal} ↗
            </a>
          </div>
        </main>

        <aside className="hidden xl:block w-72 shrink-0 py-6 pr-6">
          {/* stays in view while scrolling a long article */}
          <div className="sticky top-6 space-y-4">{sidePanel}</div>
        </aside>
      </div>
    </>
  );
}
