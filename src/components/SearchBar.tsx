import type { ArticleFilters } from "@/lib/queryParams";

export function SearchBar({ filters }: { filters: ArticleFilters }) {
  return (
    <form action="/" method="get" className="mb-5">
      {filters.category && (
        <input type="hidden" name="category" value={filters.category} />
      )}
      {filters.source && <input type="hidden" name="source" value={filters.source} />}
      {filters.saved && <input type="hidden" name="saved" value="1" />}
      {filters.history && <input type="hidden" name="history" value="1" />}
      <input
        type="search"
        name="q"
        defaultValue={filters.q}
        placeholder="Szukaj po tytule…"
        className="w-full max-w-sm rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-faint focus:outline-none focus:border-signal transition-colors"
      />
    </form>
  );
}
