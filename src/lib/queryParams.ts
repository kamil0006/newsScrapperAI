export type ArticleFilters = {
  category: string | null;
  source: string | null;
  saved: boolean;
  history: boolean;
  q: string;
};

export function buildHref(
  filters: ArticleFilters,
  overrides: Partial<ArticleFilters>,
): string {
  const merged = { ...filters, ...overrides };
  const params = new URLSearchParams();

  if (merged.category) params.set("category", merged.category);
  if (merged.source) params.set("source", merged.source);
  if (merged.saved) params.set("saved", "1");
  if (merged.history) params.set("history", "1");
  if (merged.q) params.set("q", merged.q);

  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}
