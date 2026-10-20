import { dictionaries } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/locale";

export function DailyBrief({
  content,
  locale = "pl",
}: {
  content: string;
  locale?: Locale;
}) {
  return (
    <div
      className="mb-6 rounded-r-md border-l-2 bg-surface/60 pl-4 pr-4 py-3"
      style={{ borderColor: "var(--signal)" }}
    >
      <p className="text-xs text-text-faint mb-1.5">{dictionaries[locale].dailyBrief.heading}</p>
      <p className="text-sm text-text-muted leading-relaxed">{content}</p>
    </div>
  );
}
