import Link from "next/link";
import { CategoryDot } from "@/components/CategoryDot";
import { PriorityBadge } from "@/components/PriorityBadge";
import { UpcomingList } from "@/components/UpcomingList";
import { toCategory } from "@/lib/categories";
import { relativeTime } from "@/lib/format";
import { dictionaries } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/locale";
import { tierFor } from "@/lib/priority";
import type { ReaderCard } from "@/lib/readerNav";

export function ReaderNext({
  upcoming,
  query,
  listHref,
  locale,
}: {
  upcoming: ReaderCard[];
  query: string;
  listHref: string;
  locale: Locale;
}) {
  const dict = dictionaries[locale].reader;
  const [next, ...more] = upcoming;
  const href = (id: string) => `/read/${id}${query ? `?${query}` : ""}`;

  if (!next) {
    return (
      <div className="rounded-lg border border-dashed border-border p-4">
        <p className="text-sm font-medium text-text">{dict.nextEmpty}</p>
        <p className="text-xs text-text-muted mt-1">{dict.nextEmptyHint}</p>
        <Link
          href={listHref}
          className="inline-block mt-3 text-xs text-text-muted hover:text-text transition-colors"
        >
          {dict.back}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        href={href(next.id)}
        className="group block rounded-lg border border-border bg-surface p-4 hover:border-text-faint transition-colors"
      >
        <span className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-text-faint">
          {dict.next}
          <span
            aria-hidden
            className="transition-transform group-hover:translate-x-0.5"
          >
            →
          </span>
        </span>
        <span className="flex items-center gap-2 flex-wrap mt-3">
          <PriorityBadge priority={next.priority} locale={locale} />
          <CategoryDot category={toCategory(next.category)} locale={locale} />
        </span>
        <span className="block font-serif text-base leading-snug text-text mt-2">
          {next.title}
        </span>
        {next.summary && (
          <span className="block text-xs text-text-muted leading-relaxed mt-1.5 line-clamp-3">
            {next.summary}
          </span>
        )}
        <span className="block text-xs text-text-faint mt-2">
          {next.sourceName} · {relativeTime(next.publishedAt, locale)}
        </span>
      </Link>
      <UpcomingList
        items={more.map((item) => {
          const tier = tierFor(item.priority, locale);
          return {
            id: item.id,
            href: href(item.id),
            title: item.title,
            sourceName: item.sourceName,
            priorityColor: tier.color,
            priorityLabel: tier.label,
          };
        })}
        moreLabel={dict.moreUpcoming(more.length)}
        lessLabel={dict.lessUpcoming}
      />
    </div>
  );
}
