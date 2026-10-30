import Link from "next/link";
import { relativeTime } from "@/lib/format";
import { dictionaries } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/locale";
import type { RelatedItem } from "@/lib/readerNav";

export function ReaderRelated({
  items,
  query,
  locale,
}: {
  items: RelatedItem[];
  query: string;
  locale: Locale;
}) {
  if (items.length === 0) return null;
  const dict = dictionaries[locale].reader;

  return (
    <section className="rounded-lg border border-border bg-surface p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-text-faint mb-2">
        {dict.related} · {items.length}
      </h2>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={`/read/${item.id}${query ? `?${query}` : ""}`}
              className={`block rounded-md px-2 py-1.5 -mx-2 hover:bg-surface-raised transition-colors ${
                item.read ? "opacity-60" : ""
              }`}
            >
              <span className="block text-sm leading-snug text-text line-clamp-2">{item.title}</span>
              <span className="block text-xs text-text-faint mt-0.5">
                {item.sourceName} · {relativeTime(item.publishedAt, locale)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
