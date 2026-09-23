"use client";

import { useRouter } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";

export function ReadTrackingLink({
  articleId,
  url,
  read = false,
  className,
  children,
}: {
  articleId: string;
  url: string;
  read?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();

  function markRead() {
    if (read) return;
    fetch(`/api/articles/${articleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read: true }),
    })
      .then(() => router.refresh())
      .catch(() => {});
  }

  function handleAuxClick(event: MouseEvent<HTMLAnchorElement>) {
    // środkowy przycisk myszy (otwórz w nowej karcie w tle) wywołuje
    // "auxclick", nie "click" — bez tego historia by tego nie widziała
    if (event.button === 1) markRead();
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      onClick={markRead}
      onAuxClick={handleAuxClick}
      className={className}
    >
      {children}
    </a>
  );
}
