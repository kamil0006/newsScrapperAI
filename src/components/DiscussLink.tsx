import Link from "next/link";
import { dictionaries } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/locale";

export function DiscussLink({
  articleId,
  locale = "pl",
}: {
  articleId: string;
  locale?: Locale;
}) {
  const dict = dictionaries[locale].a11y;

  return (
    <Link
      href={`/ask?article=${articleId}`}
      aria-label={dict.discuss}
      title={dict.discuss}
      className="shrink-0 text-text-faint hover:text-text transition-colors"
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    </Link>
  );
}
