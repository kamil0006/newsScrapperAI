import { CategoryDot } from "@/components/CategoryDot";
import { ReadTrackingLink } from "@/components/ReadTrackingLink";
import { dictionaries } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/locale";
import type { ArticleListItem } from "@/lib/types";

export function TopPicks({
  items,
  locale = "pl",
}: {
  items: ArticleListItem[];
  locale?: Locale;
}) {
  if (items.length === 0) return null;
  const dict = dictionaries[locale].topPicks;

  return (
    <div className="rounded-lg border border-border bg-surface p-4 mb-5">
      <h2 className="text-sm font-medium text-text">{dict.heading}</h2>
      <p className="text-xs text-text-faint mt-0.5 mb-3">{dict.subtitle(items.length)}</p>
      <ol className="space-y-1">
        {items.map((item, i) => (
          <li key={item.id} className="flex items-center gap-3 rounded-md px-2 py-1.5 -mx-2 hover:bg-surface-raised transition-colors">
            <span className="text-xs font-semibold text-text-faint w-4 text-right shrink-0">
              {i + 1}
            </span>
            <span className="shrink-0">
              <CategoryDot category={item.category} locale={locale} />
            </span>
            <ReadTrackingLink
              articleId={item.id}
              url={item.url}
              read={item.read}
              className="flex-1 min-w-0 truncate text-sm text-text hover:text-white transition-colors"
            >
              {item.title}
            </ReadTrackingLink>
            <span className="hidden sm:inline text-xs text-text-faint shrink-0">
              {item.sourceName}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
