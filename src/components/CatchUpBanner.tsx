export function CatchUpBanner({
  content,
  since,
}: {
  content: string;
  since: string;
}) {
  return (
    <div className="mb-6 rounded-lg border border-border bg-surface-raised p-5">
      <p className="font-serif text-lg text-text mb-1">Witaj z powrotem</p>
      <p className="text-xs text-text-faint mb-3">Nie było Cię tu {since}</p>
      <p className="text-sm text-text-muted leading-relaxed">{content}</p>
    </div>
  );
}
