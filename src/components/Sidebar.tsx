import Link from "next/link";
import { RefreshButton } from "@/components/RefreshButton";

type CountKey = "all" | "saved" | "history";

const NAV: {
  href: string;
  label: string;
  match: CountKey | "ask";
  countKey: CountKey | null;
}[] = [
  { href: "/", label: "Wszystkie", match: "all", countKey: "all" },
  { href: "/?saved=1", label: "Zapisane", match: "saved", countKey: "saved" },
  { href: "/?history=1", label: "Historia", match: "history", countKey: "history" },
  { href: "/ask", label: "Zapytaj AI", match: "ask", countKey: null },
];

export function Sidebar({
  active,
  counts,
}: {
  active: CountKey | "ask";
  counts: Record<CountKey, number>;
}) {
  return (
    <aside className="w-full sm:w-56 shrink-0 border-b sm:border-b-0 sm:border-r border-border px-4 sm:px-5 py-5 flex flex-row sm:flex-col gap-4 sm:gap-8 items-center sm:items-stretch">
      <div>
        <span className="font-serif text-lg tracking-tight text-text">
          newsScrapperAI
        </span>
        <p className="hidden sm:block text-xs text-text-faint mt-1">
          Mniej scrollowania, więcej sygnału.
        </p>
      </div>

      <nav className="flex flex-row sm:flex-col gap-1 flex-1 sm:flex-none">
        {NAV.map((item) => (
          <Link
            key={item.match}
            href={item.href}
            className={`flex items-center justify-between gap-2 text-sm px-2 py-1.5 rounded-md transition-colors ${
              active === item.match
                ? "text-text bg-surface"
                : "text-text-muted hover:text-text hover:bg-surface"
            }`}
          >
            <span>{item.label}</span>
            {item.countKey && (
              <span className="text-xs text-text-faint">
                {counts[item.countKey]}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <RefreshButton />
    </aside>
  );
}
