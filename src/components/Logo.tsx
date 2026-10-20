export function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
        <rect x="1" y="13" width="5" height="10" rx="1.5" fill="var(--cat-gaming)" />
        <rect x="9.5" y="7" width="5" height="16" rx="1.5" fill="var(--cat-tech)" />
        <rect x="18" y="1" width="5" height="22" rx="1.5" fill="var(--cat-ai)" />
      </svg>
      <span className="font-serif text-lg tracking-tight text-text leading-none">
        news<span className="font-semibold">Scrapper</span>
        <span className="text-signal">AI</span>
      </span>
    </div>
  );
}
