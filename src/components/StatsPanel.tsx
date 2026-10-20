import { dictionaries } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/locale";

export function StatsPanel({
  newToday,
  mustRead,
  pendingClassification,
  locale = "pl",
}: {
  newToday: number;
  mustRead: number;
  pendingClassification: number;
  locale?: Locale;
}) {
  const dict = dictionaries[locale];
  const rows = [
    { label: dict.stats.newToday, value: newToday },
    { label: dict.stats.mustRead, value: mustRead },
    { label: dict.stats.pendingClassification, value: pendingClassification },
  ];

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h3 className="text-sm font-medium text-text mb-3">{dict.stats.heading}</h3>
      <dl className="space-y-2.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3">
            <dt className="text-sm text-text-muted">{row.label}</dt>
            <dd className="text-sm text-text font-medium">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
