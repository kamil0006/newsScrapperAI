"use client";

import { useTransition } from "react";
import { dispatchCategoryHidden } from "@/components/CategoryHideToast";
import type { Category } from "@/lib/categories";
import { dictionaries } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/locale";
import { setCategoryVisibility } from "@/lib/settings/actions";

export function HideCategoryButton({
  category,
  locale = "pl",
}: {
  category: Category;
  locale?: Locale;
}) {
  const dict = dictionaries[locale].a11y;
  const [pending, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    dispatchCategoryHidden(category);
    startTransition(() => {
      setCategoryVisibility(category, false);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label={dict.hideCategory}
      title={dict.hideCategoryTitle}
      className="shrink-0 -mr-1 text-text-faint hover:text-text disabled:opacity-50 transition-colors"
    >
      <svg
        width="10"
        height="10"
        viewBox="0 0 14 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      >
        <path d="M1 1l12 12M13 1L1 13" />
      </svg>
    </button>
  );
}
