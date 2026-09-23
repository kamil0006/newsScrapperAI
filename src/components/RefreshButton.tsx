"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RefreshButton() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  async function handleClick() {
    setStatus("loading");
    try {
      const res = await fetch("/api/scrape", { method: "POST" });
      if (!res.ok) throw new Error("Scraper zwrócił błąd");
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
      className="text-sm text-text-muted hover:text-text border border-border rounded-md px-3 py-1.5 transition-colors disabled:opacity-50"
    >
      {status === "loading"
        ? "Pobieranie…"
        : status === "error"
          ? "Błąd — spróbuj ponownie"
          : "Pobierz nowe newsy"}
    </button>
  );
}
