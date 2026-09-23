import { CATEGORY_COLOR, type Category } from "@/lib/categories";

export function CategoryDot({ category }: { category: Category }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-text-muted text-sm">
      <span
        className="inline-block w-2 h-2 rounded-full shrink-0"
        style={{ background: CATEGORY_COLOR[category] }}
        aria-hidden
      />
      {category}
    </span>
  );
}
