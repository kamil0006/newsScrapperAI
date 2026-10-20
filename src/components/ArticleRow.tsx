import Link from "next/link";
import { ArticleTitleLink } from "@/components/ArticleTitleLink";
import { CategoryDot } from "@/components/CategoryDot";
import { DiscussLink } from "@/components/DiscussLink";
import { DismissButton } from "@/components/DismissButton";
import { PriorityBadge } from "@/components/PriorityBadge";
import { SaveToggle } from "@/components/SaveToggle";
import { dictionaries } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/locale";
import { pluralSources, relativeTime } from "@/lib/format";
import type { ArticleListItem } from "@/lib/types";

export function ArticleRow({
  article,
  locale = "pl",
}: {
  article: ArticleListItem;
  locale?: Locale;
}) {
  const dict = dictionaries[locale];

  return (
    <article
      className={`rounded-lg border border-border bg-surface p-4 space-y-2 transition-opacity ${
        article.read ? "opacity-50 hover:opacity-90" : ""
      }`}
    >
      <div className="flex items-center gap-3 flex-wrap">
        <PriorityBadge priority={article.priority} locale={locale} />
        <CategoryDot category={article.category} locale={locale} />
        <span className="text-xs text-text-faint">{article.sourceName}</span>
        <span className="text-xs text-text-faint">
          {relativeTime(article.publishedAt, locale)}
        </span>
        {article.consensusSources > 1 && (
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              color: "var(--signal)",
              background: "color-mix(in srgb, var(--signal) 16%, transparent)",
            }}
          >
            {pluralSources(article.consensusSources, locale)}
          </span>
        )}
        {article.threadId && article.threadCount > 1 && (
          <Link
            href={`/thread/${article.threadId}`}
            className="text-xs font-medium px-2 py-0.5 rounded-full border border-border text-text-muted hover:text-text hover:border-text-faint transition-colors"
          >
            {dict.article.thread} · {article.threadCount}
          </Link>
        )}
        <span className="ml-auto flex items-center gap-3">
          <SaveToggle articleId={article.id} initialSaved={article.saved} locale={locale} />
          <DiscussLink articleId={article.id} locale={locale} />
          <DismissButton articleId={article.id} locale={locale} />
        </span>
      </div>

      <ArticleTitleLink
        articleId={article.id}
        url={article.url}
        title={article.title}
        read={article.read}
      />

      {article.summary ? (
        <p className="text-sm text-text-muted leading-relaxed line-clamp-2">
          {article.summary}
        </p>
      ) : (
        <p className="text-sm text-text-faint italic">{dict.article.notClassified}</p>
      )}

      {article.qualityLabel === "lanie_wody" && (
        <p
          className="text-xs text-text-faint flex items-center gap-1.5"
          title={article.qualityNote ?? undefined}
        >
          <span aria-hidden>⚠</span>
          {dict.article.maybeFluff}
          {article.qualityNote ? ` — ${article.qualityNote}` : ""}
        </p>
      )}
    </article>
  );
}
