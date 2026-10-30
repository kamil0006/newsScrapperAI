"use client";

import { useEffect } from "react";

// marks the article read once the reader actually opens in the browser —
// not on the server, so a link prefetch can never count as "read"
export function MarkReadOnMount({ articleId, alreadyRead }: { articleId: string; alreadyRead: boolean }) {
  useEffect(() => {
    if (alreadyRead) return;
    fetch(`/api/articles/${articleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read: true }),
    }).catch(() => {});
  }, [articleId, alreadyRead]);

  return null;
}
