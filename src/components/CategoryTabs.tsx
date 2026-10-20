import Link from "next/link";
import { CATEGORIES, categoryLabel, type Category } from "@/lib/categories";
import { dictionaries } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/locale";
import { buildHref, type ArticleFilters } from "@/lib/queryParams";

export function CategoryTabs({
  filters,
  hiddenCategories = [],
  locale = "pl",
}: {
  filters: ArticleFilters;
  hiddenCategories?: Category[];
  locale?: Locale;
}) {
  const dict = dictionaries[locale];
  const visibleCategories = CATEGORIES.filter((category) => !hiddenCategories.includes(category));
  const tabs: { label: string; value: Category | null }[] = [
    { label: dict.common.all, value: null },
    ...visibleCategories.map((category) => ({ label: categoryLabel(category, locale), value: category })),
  ];

  return (
    <div className="flex gap-1 flex-wrap">
      {tabs.map((tab) => {
        const isActive = tab.value === filters.category;
        return (
          <Link
            key={tab.label}
            href={buildHref(filters, { category: tab.value })}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
              isActive
                ? "bg-surface-raised text-text"
                : "text-text-muted hover:text-text"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
