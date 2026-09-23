export function StatsPanel({
  newToday,
  mustRead,
  pendingClassification,
}: {
  newToday: number;
  mustRead: number;
  pendingClassification: number;
}) {
  const rows = [
    { label: "Nowe dzisiaj", value: newToday },
    { label: "Priorytet 5, do przeczytania", value: mustRead },
    { label: "Czeka na klasyfikację", value: pendingClassification },
  ];

  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <h3 className="text-sm font-medium text-text mb-3">W skrócie</h3>
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
