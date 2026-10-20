import { dictionaries } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/locale";

export function CatchUpBanner({
  content,
  since,
  locale = "pl",
}: {
  content: string;
  since: string;
  locale?: Locale;
}) {
  const dict = dictionaries[locale];
  return (
    <div className="mb-6 rounded-lg border border-border bg-surface-raised p-5">
      <p className="font-serif text-lg text-text mb-1">{dict.catchUp.welcomeBack}</p>
      <p className="text-xs text-text-faint mb-3">
        {dict.catchUp.away} {since}
      </p>
      <p className="text-sm text-text-muted leading-relaxed">{content}</p>
    </div>
  );
}
