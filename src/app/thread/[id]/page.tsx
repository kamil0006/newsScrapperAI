import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleRow } from "@/components/ArticleRow";
import { Sidebar } from "@/components/Sidebar";
import { toCategory } from "@/lib/categories";
import { getNavCounts } from "@/lib/navCounts";
import { prisma } from "@/lib/prisma";
import type { ArticleListItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ThreadPage({
  params,
}: PageProps<"/thread/[id]">) {
  const { id } = await params;

  const [rows, counts] = await Promise.all([
    prisma.article.findMany({
      where: { threadId: id },
      orderBy: [{ publishedAt: "asc" }, { fetchedAt: "asc" }],
    }),
    getNavCounts(),
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
    read: row.read,
    saved: row.saved,
    consensusSources: row.consensusSources,
    qualityLabel: row.qualityLabel,
    qualityNote: row.qualityNote,
    threadId: row.threadId,
    threadCount: rows.length,
  }));

  return (
    <>
      <Sidebar active="all" counts={counts} />

      <div className="flex-1 flex flex-col">
        <main className="flex-1 min-w-0 px-4 sm:px-6 py-6 max-w-2xl">
          <Link
            href="/"
            className="text-sm text-text-muted hover:text-text transition-colors"
          >
            ← Wróć do listy
          </Link>

          <div className="mt-4 mb-6">
            <h1 className="font-serif text-2xl text-text">
              Wątek — {articles.length} aktualizacje
            </h1>
            <p className="text-sm text-text-muted mt-1">
              Ta sama rozwijająca się historia, w kolejności chronologicznej.
            </p>
          </div>

          <div className="space-y-3">
            {articles.map((article) => (
              <ArticleRow key={article.id} article={article} />
            ))}
          </div>
        </main>
      </div>
    </>
  );
}
