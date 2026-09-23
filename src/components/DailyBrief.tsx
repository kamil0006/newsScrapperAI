export function DailyBrief({ content }: { content: string }) {
  return (
    <div
      className="mb-6 rounded-r-md border-l-2 bg-surface/60 pl-4 pr-4 py-3"
      style={{ borderColor: "var(--signal)" }}
    >
      <p className="text-xs text-text-faint mb-1.5">Przegląd dnia</p>
      <p className="text-sm text-text-muted leading-relaxed">{content}</p>
    </div>
  );
}
