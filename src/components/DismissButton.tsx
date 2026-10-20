"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { dictionaries } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/locale";

export function DismissButton({
  articleId,
  locale = "pl",
}: {
  articleId: string;
  locale?: Locale;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const dict = dictionaries[locale].a11y;

  async function handleClick() {
    setPending(true);
    try {
      await fetch(`/api/articles/${articleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dismissed: true }),
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      aria-label={dict.dismiss}
      title={dict.dismissTitle}
      className="shrink-0 text-text-faint hover:text-[var(--priority-5)] disabled:opacity-50 transition-colors"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      >
        <path d="M1 1l12 12M13 1L1 13" />
      </svg>
    </button>
  );
}
