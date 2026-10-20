"use client";

import { useRouter } from "next/navigation";
import { dictionaries } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/locale";
import { buildHref, type ArticleFilters } from "@/lib/queryParams";

export function SourceFilter({
  sources,
  filters,
  locale = "pl",
}: {
  sources: string[];
  filters: ArticleFilters;
  locale?: Locale;
}) {
  const router = useRouter();
  const dict = dictionaries[locale];

  return (
    <select
      value={filters.source ?? ""}
      onChange={(e) => {
        router.push(buildHref(filters, { source: e.target.value || null }));
      }}
      className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text focus:outline-none focus:border-signal transition-colors"
    >
      <option value="">{dict.sourceFilter.allSources}</option>
      {sources.map((source) => (
        <option key={source} value={source}>
          {source}
        </option>
      ))}
    </select>
  );
}
