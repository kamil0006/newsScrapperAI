"use client";

import { useRouter } from "next/navigation";
import { buildHref, type ArticleFilters } from "@/lib/queryParams";

export function SourceFilter({
  sources,
  filters,
}: {
  sources: string[];
  filters: ArticleFilters;
}) {
  const router = useRouter();

  return (
    <select
      value={filters.source ?? ""}
      onChange={(e) => {
        router.push(buildHref(filters, { source: e.target.value || null }));
      }}
      className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text focus:outline-none focus:border-signal transition-colors"
    >
      <option value="">Wszystkie źródła</option>
      {sources.map((source) => (
        <option key={source} value={source}>
          {source}
        </option>
      ))}
    </select>
  );
}
