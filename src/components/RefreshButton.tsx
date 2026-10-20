"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { dictionaries } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/locale";

function RefreshIcon({ spinning }: { spinning: boolean }) {
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
      className={`shrink-0 ${spinning ? "animate-spin" : ""}`}
    >
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}

export function RefreshButton({ locale = "pl" }: { locale?: Locale }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const dict = dictionaries[locale].refreshButton;

  async function handleClick() {
    setStatus("loading");
    try {
      const res = await fetch("/api/scrape", { method: "POST" });
      if (!res.ok) throw new Error("Scraper returned an error");
      router.refresh();
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={status === "loading"}
      className="flex items-center justify-center gap-2 text-sm text-text-muted hover:text-text border border-border rounded-md px-3 py-1.5 transition-colors disabled:opacity-50"
    >
      <RefreshIcon spinning={status === "loading"} />
      {status === "loading" ? dict.loading : status === "error" ? dict.error : dict.idle}
    </button>
  );
}
