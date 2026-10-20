import { dictionaries } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/locale";

export function pluralSources(count: number, locale: Locale = "pl"): string {
  return dictionaries[locale].sources.count(count);
}

export function relativeTime(date: Date | null, locale: Locale = "pl"): string {
  const t = dictionaries[locale].time;
  if (!date) return t.noDate;

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.round(diffMs / 60_000);

  if (minutes < 1) return t.justNow;
  if (minutes < 60) return t.minutesAgo(minutes);

  const hours = Math.round(minutes / 60);
  if (hours < 24) return t.hoursAgo(hours);

  const days = Math.round(hours / 24);
  if (days < 7) return t.daysAgo(days);

  return date.toLocaleDateString(locale === "pl" ? "pl-PL" : "en-US", {
    day: "numeric",
    month: "short",
  });
}
