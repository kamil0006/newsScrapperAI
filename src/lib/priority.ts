import { dictionaries } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/locale";

export type PriorityTier = {
  value: number;
  label: string;
  description: string;
  color: string;
};

export function priorityTiers(locale: Locale = "pl"): PriorityTier[] {
  const t = dictionaries[locale].priority;
  return [
    { value: 5, label: t.tier5.label, description: t.tier5.description, color: "var(--priority-5)" },
    { value: 4, label: t.tier4.label, description: t.tier4.description, color: "var(--priority-4)" },
    { value: 3, label: t.tier3.label, description: t.tier3.description, color: "var(--priority-3)" },
    { value: 2, label: t.tier2.label, description: t.tier2.description, color: "var(--priority-2)" },
    { value: 1, label: t.tier1.label, description: t.tier1.description, color: "var(--priority-1)" },
  ];
}

export function tierFor(priority: number | null, locale: Locale = "pl"): PriorityTier {
  const t = dictionaries[locale].priority;
  const unclassified: PriorityTier = {
    value: 0,
    label: t.unclassified.label,
    description: t.unclassified.description,
    color: "var(--text-faint)",
  };

  if (!priority) return unclassified;
  return priorityTiers(locale).find((tier) => tier.value === priority) ?? unclassified;
}
