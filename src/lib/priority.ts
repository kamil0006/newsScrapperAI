export type PriorityTier = {
  value: number;
  label: string;
  description: string;
  color: string;
};

export const PRIORITY_TIERS: PriorityTier[] = [
  {
    value: 5,
    label: "Koniecznie",
    description: "Przełomowe albo bardzo istotne — nie przegap.",
    color: "var(--priority-5)",
  },
  {
    value: 4,
    label: "Ważne",
    description: "Warto wiedzieć, ma realny wpływ.",
    color: "var(--priority-4)",
  },
  {
    value: 3,
    label: "Warto",
    description: "Ciekawe, ale bez pośpiechu.",
    color: "var(--priority-3)",
  },
  {
    value: 2,
    label: "Mało istotne",
    description: "Przeczytaj, jeśli zostanie Ci czas.",
    color: "var(--priority-2)",
  },
  {
    value: 1,
    label: "Pomijalne",
    description: "Można spokojnie pominąć.",
    color: "var(--priority-1)",
  },
];

const UNCLASSIFIED_TIER: PriorityTier = {
  value: 0,
  label: "Bez oceny",
  description: "Jeszcze nie sklasyfikowane przez AI.",
  color: "var(--text-faint)",
};

export function tierFor(priority: number | null): PriorityTier {
  if (!priority) return UNCLASSIFIED_TIER;
  return (
    PRIORITY_TIERS.find((tier) => tier.value === priority) ?? UNCLASSIFIED_TIER
  );
}
