import { CATEGORY_COLOR, categoryLabel, type Category } from "@/lib/categories";
import type { Locale } from "@/lib/i18n/locale";

export function CategoryDot({
  category,
  locale = "pl",
}: {
  category: Category;
  locale?: Locale;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-text-muted text-sm">
      <span
        className="inline-block w-2 h-2 rounded-full shrink-0"
        style={{ background: CATEGORY_COLOR[category] }}
        aria-hidden
      />
      {categoryLabel(category, locale)}
    </span>
  );
}
