import Link from "next/link";
import { LocaleToggle } from "@/components/LocaleToggle";
import { Logo } from "@/components/Logo";
import { RefreshButton } from "@/components/RefreshButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { logout } from "@/lib/auth/actions";
import { dictionaries } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/locale";
import type { Theme } from "@/lib/theme";

type CountKey = "all" | "saved" | "history";

function LogoutIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export function Sidebar({
  active,
  counts,
  locale = "pl",
  theme = "dark",
}: {
  active: CountKey | "ask" | "settings";
  counts: Record<CountKey, number>;
  locale?: Locale;
  theme?: Theme;
}) {
  const dict = dictionaries[locale];
  const NAV: {
    href: string;
    label: string;
    match: CountKey | "ask" | "settings";
    countKey: CountKey | null;
  }[] = [
    { href: "/", label: dict.common.all, match: "all", countKey: "all" },
    { href: "/?saved=1", label: dict.common.saved, match: "saved", countKey: "saved" },
    { href: "/?history=1", label: dict.common.history, match: "history", countKey: "history" },
    { href: "/ask", label: dict.common.ask, match: "ask", countKey: null },
    { href: "/settings", label: dict.common.settings, match: "settings", countKey: null },
  ];

  return (
    <aside className="w-full sm:w-56 shrink-0 border-b sm:border-b-0 sm:border-r border-border px-4 sm:px-5 py-3 sm:py-5 flex flex-col sm:gap-6 sm:sticky sm:top-0 sm:h-screen">
      <div data-tour="logo">
        <Logo />
        <p className="hidden sm:block text-xs text-text-faint mt-2">{dict.sidebar.tagline}</p>
      </div>

      <nav
        data-tour="nav"
        className="flex sm:flex-col gap-1 overflow-x-auto sm:overflow-visible -mx-4 sm:mx-0 px-4 sm:px-0 mt-3 sm:mt-0 pb-1 sm:pb-0"
      >
        {NAV.map((item) => (
          <Link
            key={item.match}
            href={item.href}
            data-tour={item.match === "ask" ? "nav-ask" : undefined}
            className={`flex items-center justify-between gap-2 text-sm px-2 py-1.5 rounded-md transition-colors shrink-0 sm:shrink whitespace-nowrap ${
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

      <div className="flex items-center gap-2 mt-3 sm:hidden">
        <span data-tour="refresh">
          <RefreshButton locale={locale} />
        </span>
        <span data-tour="account-toggles" className="flex items-center gap-2">
          <ThemeToggle theme={theme} />
          <LocaleToggle locale={locale} />
        </span>
        <form action={logout}>
          <button
            type="submit"
            aria-label={dict.common.logout}
            title={dict.common.logout}
            className="flex items-center justify-center w-8 h-8 rounded-md text-text-faint hover:text-text hover:bg-surface transition-colors"
          >
            <LogoutIcon />
          </button>
        </form>
      </div>

      <div className="hidden sm:block" data-tour="refresh">
        <RefreshButton locale={locale} />
      </div>

      <div className="hidden sm:flex sm:flex-col sm:gap-3 sm:mt-auto sm:pt-3 sm:border-t sm:border-border">
        <div className="flex items-center gap-2" data-tour="account-toggles">
          <ThemeToggle theme={theme} />
          <LocaleToggle locale={locale} />
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center gap-2 -mx-2 px-2 py-1.5 rounded-md text-sm text-text-faint hover:text-text hover:bg-surface transition-colors"
          >
            <LogoutIcon />
            {dict.common.logout}
          </button>
        </form>
      </div>
    </aside>
  );
}
