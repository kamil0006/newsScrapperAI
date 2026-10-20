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
    // the middle mouse button (open in a background tab) fires
    // "auxclick", not "click" — without this, history wouldn't see it
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
