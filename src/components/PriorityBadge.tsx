import type { Locale } from "@/lib/i18n/locale";
import { tierFor } from "@/lib/priority";

export function PriorityBadge({
  priority,
  locale = "pl",
}: {
  priority: number | null;
  locale?: Locale;
}) {
  const tier = tierFor(priority, locale);

  return (
    <span className="inline-flex items-center gap-2 shrink-0">
      <span
        className="inline-flex items-center justify-center w-5 h-5 rounded text-xs font-semibold text-bg"
        style={{ background: tier.color }}
      >
        {tier.value || "–"}
      </span>
      <span
        className="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
        style={{
          color: tier.color,
          background: `color-mix(in srgb, ${tier.color} 16%, transparent)`,
        }}
      >
        {tier.label}
      </span>
    </span>
  );
}
