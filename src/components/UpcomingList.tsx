"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

export type UpcomingItem = {
  id: string;
  href: string;
  title: string;
  sourceName: string;
  priorityColor: string;
  priorityLabel: string;
};

// whether the list is open is a per-browser convenience — kept in
// localStorage and shared by both copies of the panel (side + bottom)
const STORAGE_KEY = "reader.upcomingExpanded";
const CHANGE_EVENT = "reader-upcoming-change";

function readExpanded(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function setExpanded(value: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  } catch {
    // storage blocked (private mode etc.) — the toggle just won't be remembered
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function UpcomingList({
  items,
  moreLabel,
  lessLabel,
}: {
  items: UpcomingItem[];
  moreLabel: string;
  lessLabel: string;
}) {
  // server render and first paint are always collapsed; the saved choice
  // applies right after hydration
  const expanded = useSyncExternalStore(subscribe, readExpanded, () => false);
  if (items.length === 0) return null;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-xs text-text-muted hover:text-text hover:bg-surface-raised transition-colors"
      >
        {expanded ? lessLabel : moreLabel}
        <span aria-hidden className={`transition-transform ${expanded ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>

      {expanded && (
        <ul className="mt-1 space-y-0.5">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex items-start gap-2.5 rounded-md px-2 py-1.5 hover:bg-surface-raised transition-colors"
              >
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                  style={{ background: item.priorityColor }}
                  title={item.priorityLabel}
                  aria-label={item.priorityLabel}
                />
                <span className="min-w-0">
                  <span className="block text-sm leading-snug text-text line-clamp-2">{item.title}</span>
                  <span className="block text-xs text-text-faint mt-0.5">{item.sourceName}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
