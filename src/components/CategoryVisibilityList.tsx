"use client";

import { useState, useTransition } from "react";
import { CategoryDot } from "@/components/CategoryDot";
import { CATEGORIES, type Category } from "@/lib/categories";
import { dictionaries } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/locale";
import { setCategoryVisibility } from "@/lib/settings/actions";

export function CategoryVisibilityList({
  hiddenCategories,
  locale = "pl",
}: {
  hiddenCategories: Category[];
  locale?: Locale;
}) {
  const dict = dictionaries[locale];
  const [hidden, setHidden] = useState(() => new Set(hiddenCategories));
  const [, startTransition] = useTransition();

  function toggle(category: Category) {
    const isCurrentlyHidden = hidden.has(category);
    const next = new Set(hidden);
    if (isCurrentlyHidden) next.delete(category);
    else next.add(category);
    setHidden(next);
    startTransition(() => {
      setCategoryVisibility(category, isCurrentlyHidden);
    });
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h2 className="text-sm font-medium text-text mb-3">{dict.settings.categoriesHeading}</h2>
      <div className="space-y-1">
        {CATEGORIES.map((category) => {
          const visible = !hidden.has(category);
          return (
            <div
              key={category}
              className="flex items-center justify-between gap-3 py-2 px-2 -mx-2 rounded-md hover:bg-surface-raised transition-colors"
            >
              <CategoryDot category={category} locale={locale} />
              <button
                type="button"
                role="switch"
                aria-checked={visible}
                onClick={() => toggle(category)}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                  visible ? "bg-signal" : "bg-border"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 rounded-full bg-bg transition-transform ${
                    visible ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
