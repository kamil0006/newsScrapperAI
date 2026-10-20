"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { dictionaries } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/locale";
import { buildHref, type ArticleFilters } from "@/lib/queryParams";

const DEBOUNCE_MS = 300;

export function SearchBar({
  filters,
  locale = "pl",
}: {
  filters: ArticleFilters;
  locale?: Locale;
}) {
  const dict = dictionaries[locale];
  const router = useRouter();
  const [value, setValue] = useState(filters.q);
  const [lastSeenQ, setLastSeenQ] = useState(filters.q);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // stay in sync if the query changes from elsewhere (e.g. clearing filters) —
  // adjusted during render rather than an effect, per React's guidance for
  // resetting state when a prop changes
  if (filters.q !== lastSeenQ) {
    setLastSeenQ(filters.q);
    setValue(filters.q);
  }

  function search(q: string) {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    router.replace(buildHref(filters, { q }), { scroll: false });
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.value;
    setValue(next);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => search(next), DEBOUNCE_MS);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") search(value);
  }

  return (
    <div className="mb-5">
      <input
        type="search"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={dict.search.placeholder}
        className="w-full max-w-sm rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-faint focus:outline-none focus:border-signal transition-colors"
      />
    </div>
  );
}
