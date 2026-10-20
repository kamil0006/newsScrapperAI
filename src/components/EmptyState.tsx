import { dictionaries } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/locale";

export function EmptyState({
  variant = "all",
  query,
  locale = "pl",
}: {
  variant?: "all" | "saved" | "history" | "search";
  query?: string;
  locale?: Locale;
}) {
  const dict = dictionaries[locale].emptyState;
  const { title, body } =
    variant === "search"
      ? { title: dict.search.title, body: dict.search.body(query ?? "") }
      : dict[variant];

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
      <p className="font-serif text-2xl text-text mb-2">{title}</p>
      <p className="text-text-muted max-w-[50ch]">{body}</p>
    </div>
  );
}
