"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Locale } from "@/lib/i18n/locale";

export function LocaleToggle({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function setLocale(target: Locale) {
    if (target === locale || pending) return;
    setPending(true);
    try {
      await fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: target }),
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="relative inline-flex w-[60px] shrink-0 rounded-full border border-border bg-surface p-0.5 text-[11px]">
      <span
        aria-hidden="true"
        className={`absolute inset-y-0.5 left-0.5 w-7 rounded-full bg-surface-raised shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          locale === "en" ? "translate-x-7" : "translate-x-0"
        }`}
      />
      {(["pl", "en"] as const).map((option) => (
        <button
          key={option}
          onClick={() => setLocale(option)}
          disabled={pending}
          aria-current={option === locale}
          aria-label={option === "en" ? "Switch to English" : "Przełącz na polski"}
          className={`relative z-10 flex-1 py-1 text-center font-medium transition-colors disabled:opacity-50 ${
            option === locale ? "text-text" : "text-text-faint hover:text-text"
          }`}
        >
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
