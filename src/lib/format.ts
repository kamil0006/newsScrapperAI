export function pluralSources(count: number): string {
  if (count >= 2 && count <= 4) return `${count} źródła`;
  return `${count} źródeł`;
}

export function relativeTime(date: Date | null): string {
  if (!date) return "brak daty";

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.round(diffMs / 60_000);

  if (minutes < 1) return "przed chwilą";
  if (minutes < 60) return `${minutes} min temu`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} godz. temu`;

  const days = Math.round(hours / 24);
  if (days < 7) return `${days} dni temu`;

  return date.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}
