"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Theme } from "@/lib/theme";

function SunIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M20.5 14.5c-1.2.5-2.5.8-3.9.8-5.5 0-10-4.5-10-10 0-1.4.3-2.7.8-3.9C4 2.9 2 6.2 2 10c0 6.1 4.9 11 11 11 3.8 0 7.1-2 9-5z" />
    </svg>
  );
}

export function ThemeToggle({ theme }: { theme: Theme }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function setTheme(target: Theme) {
    if (target === theme || pending) return;
    setPending(true);
    document.documentElement.setAttribute("data-theme", target);
    try {
      await fetch("/api/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: target }),
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="relative inline-flex w-[60px] shrink-0 rounded-full border border-border bg-surface p-0.5">
      <span
        aria-hidden="true"
        className={`absolute inset-y-0.5 left-0.5 w-7 rounded-full bg-surface-raised shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          theme === "light" ? "translate-x-7" : "translate-x-0"
        }`}
      />
      <button
        onClick={() => setTheme("dark")}
        disabled={pending}
        aria-current={theme === "dark"}
        aria-label="Dark theme"
        className={`relative z-10 flex-1 py-1 flex items-center justify-center transition-colors disabled:opacity-50 ${
          theme === "dark" ? "text-text" : "text-text-faint hover:text-text"
        }`}
      >
        <MoonIcon />
      </button>
      <button
        onClick={() => setTheme("light")}
        disabled={pending}
        aria-current={theme === "light"}
        aria-label="Light theme"
        className={`relative z-10 flex-1 py-1 flex items-center justify-center transition-colors disabled:opacity-50 ${
          theme === "light" ? "text-text" : "text-text-faint hover:text-text"
        }`}
      >
        <SunIcon />
      </button>
    </div>
  );
}
