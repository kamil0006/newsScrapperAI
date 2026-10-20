import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArticleRow } from "@/components/ArticleRow";
import { Sidebar } from "@/components/Sidebar";
import { getCurrentUserId } from "@/lib/auth/currentUser";
import { toCategory } from "@/lib/categories";
import { parseHiddenCategories } from "@/lib/categoryPrefs";
import { dictionaries } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/locale";
import { getNavCounts } from "@/lib/navCounts";
import { prisma } from "@/lib/prisma";
import type { ArticleListItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ThreadPage({
  params,
}: PageProps<"/thread/[id]">) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const { id } = await params;
  const locale = await getLocale();
  const dict = dictionaries[locale];

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { hiddenCategories: true } });
  const hiddenCategories = parseHiddenCategories(user?.hiddenCategories ?? "");

  const [rows, counts] = await Promise.all([
    prisma.article.findMany({
      where: { threadId: id },
      orderBy: [{ publishedAt: "asc" }, { fetchedAt: "asc" }],
      include: { articleStates: { where: { userId } } },
    }),
    getNavCounts(userId, hiddenCategories),
  ]);

  if (rows.length === 0) notFound();

  const articles: ArticleListItem[] = rows.map((row) => ({
    id: row.id,
    url: row.url,
    title: row.title,
    summary: row.summary,
    sourceName: row.sourceName,
    category: toCategory(row.category),
    priority: row.priority,
    publishedAt: row.publishedAt,
    read: row.articleStates[0]?.read ?? false,
    saved: row.articleStates[0]?.saved ?? false,
    consensusSources: row.consensusSources,
    qualityLabel: row.qualityLabel,
    qualityNote: row.qualityNote,
    threadId: row.threadId,
    threadCount: rows.length,
  }));

  return (
    <>
      <Sidebar active="all" counts={counts} locale={locale} />

      <div className="flex-1 flex flex-col">
        <main className="flex-1 min-w-0 px-4 sm:px-6 py-6 max-w-2xl">
          <Link
            href="/"
            className="text-sm text-text-muted hover:text-text transition-colors"
          >
            {dict.thread.back}
          </Link>

          <div className="mt-4 mb-6">
            <h1 className="font-serif text-2xl text-text">
              {dict.thread.heading(articles.length)}
            </h1>
            <p className="text-sm text-text-muted mt-1">{dict.thread.subtitle}</p>
          </div>

          <div className="space-y-3">
            {articles.map((article) => (
              <ArticleRow key={article.id} article={article} locale={locale} />
            ))}
          </div>
        </main>
      </div>
    </>
  );
}
