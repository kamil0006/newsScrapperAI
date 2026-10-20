"use client";

import { useEffect } from "react";

// records a visit only after actually mounting in the browser — unlike a
// read in a server component, link prefetching (e.g. "All" in the sidebar)
// doesn't trigger effects, so it won't skew the counter
export function VisitTracker() {
  useEffect(() => {
    fetch("/api/visit", { method: "POST" }).catch(() => {});
  }, []);

  return null;
}
