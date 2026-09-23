"use client";

import { useEffect } from "react";

// zapisuje wizytę dopiero po realnym zamontowaniu w przeglądarce — w
// odróżnieniu od odczytu w komponencie serwerowym, prefetch linków (np.
// "Wszystkie" w sidebarze) nie odpala efektów, więc nie zafałszuje licznika
export function VisitTracker() {
  useEffect(() => {
    fetch("/api/visit", { method: "POST" }).catch(() => {});
  }, []);

  return null;
}
