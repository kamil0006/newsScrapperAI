"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { categoryLabel, type Category } from "@/lib/categories";
import { dictionaries } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/locale";
import { setCategoryVisibility } from "@/lib/settings/actions";

export const CATEGORY_HIDDEN_EVENT = "category:hidden";

export function dispatchCategoryHidden(category: Category) {
  window.dispatchEvent(new CustomEvent<Category>(CATEGORY_HIDDEN_EVENT, { detail: category }));
}

const AUTO_DISMISS_MS = 6000;

export function CategoryHideToast({ locale = "pl" }: { locale?: Locale }) {
  const dict = dictionaries[locale].categoryToast;
  const [category, setCategory] = useState<Category | null>(null);
  const [, startTransition] = useTransition();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onHidden(e: Event) {
      const detail = (e as CustomEvent<Category>).detail;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setCategory(detail);
      timeoutRef.current = setTimeout(() => setCategory(null), AUTO_DISMISS_MS);
    }
    window.addEventListener(CATEGORY_HIDDEN_EVENT, onHidden);
    return () => {
      window.removeEventListener(CATEGORY_HIDDEN_EVENT, onHidden);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!category) return null;

  function handleUndo() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const toRestore = category;
    setCategory(null);
    if (toRestore) {
      startTransition(() => {
        setCategoryVisibility(toRestore, true);
      });
    }
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-md border border-border bg-surface-raised px-4 py-2.5 text-sm text-text shadow-lg">
      <span>{dict.hidden(categoryLabel(category, locale))}</span>
      <button
        type="button"
        onClick={handleUndo}
        className="font-medium text-signal hover:opacity-80 transition-opacity"
      >
        {dict.undo}
      </button>
    </div>
  );
}
