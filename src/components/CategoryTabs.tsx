import Link from "next/link";
import { CATEGORIES, type Category } from "@/lib/categories";
import { buildHref, type ArticleFilters } from "@/lib/queryParams";

const TABS: { label: string; value: Category | null }[] = [
  { label: "Wszystkie", value: null },
  ...CATEGORIES.map((category) => ({ label: category, value: category })),
];

export function CategoryTabs({ filters }: { filters: ArticleFilters }) {
  return (
    <div className="flex gap-1 flex-wrap">
      {TABS.map((tab) => {
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
