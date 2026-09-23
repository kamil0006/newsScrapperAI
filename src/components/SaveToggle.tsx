"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SaveToggle({
  articleId,
  initialSaved,
}: {
  articleId: string;
  initialSaved: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    const next = !saved;
    setSaved(next);
    try {
      await fetch(`/api/articles/${articleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saved: next }),
      });
      router.refresh();
    } catch {
      setSaved(!next);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? "Usuń z zapisanych" : "Zapisz na później"}
      className="shrink-0 text-text-faint hover:text-text disabled:opacity-50 transition-colors"
    >
      {saved ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ color: "var(--signal)" }}>
          <path d="M3 1.5A1.5 1.5 0 0 1 4.5 0h7A1.5 1.5 0 0 1 13 1.5V16l-5-3.2L3 16V1.5Z" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
          <path d="M3 1.5A1.5 1.5 0 0 1 4.5 0h7A1.5 1.5 0 0 1 13 1.5V16l-5-3.2L3 16V1.5Z" />
        </svg>
      )}
    </button>
  );
}
