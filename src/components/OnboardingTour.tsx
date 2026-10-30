"use client";

import { useEffect, useState } from "react";
import { completeOnboarding } from "@/lib/onboarding/actions";

const TARGET_SELECTORS: (string | null)[] = [
  '[data-tour="logo"]',
  '[data-tour="nav"]',
  '[data-tour="category-tabs"]',
  '[data-tour="article-meta"]',
  '[data-tour="article-title"]',
  '[data-tour="article-actions"]',
  '[data-tour="refresh"]',
  '[data-tour="nav-ask"]',
  '[data-tour="account-toggles"]',
];

type Step = { title: string; body: string };
type Labels = {
  next: string;
  back: string;
  skip: string;
  done: string;
};

function findVisibleElement(selector: string): HTMLElement | null {
  if (typeof document === "undefined") return null;
  const candidates = document.querySelectorAll<HTMLElement>(selector);
  for (const el of candidates) {
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return el;
  }
  return null;
}

type ResolvedStep = { step: Step; selector: string | null };

const MARGIN = 10;
const TOOLTIP_WIDTH = 320;

export function OnboardingTour({
  steps,
  active,
  labels,
}: {
  steps: Step[];
  active: boolean;
  labels: Labels;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [tick, setTick] = useState(0);
  // starts empty on both server and the first client render (matching output
  // avoids a hydration mismatch) — populated from the real DOM right after
  // mount, since `document` only exists client-side
  const [resolvedSteps, setResolvedSteps] = useState<ResolvedStep[]>([]);

  useEffect(() => {
    if (!active || dismissed) return;
    const resolved = steps
      .map((step, i) => ({ step, selector: TARGET_SELECTORS[i] ?? null }))
      .filter(({ selector }) => selector === null || findVisibleElement(selector) !== null);
    // reads the real DOM (which steps' targets actually exist) — there is no
    // React state this could be derived from instead
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResolvedSteps(resolved);
    // recomputed once per activation; re-running on every tick would let
    // steps shift mid-tour if content changes underneath the user
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, dismissed]);

  const show = active && !dismissed && resolvedSteps.length > 0;
  const current = resolvedSteps[stepIndex];

  const selector = show ? (current?.selector ?? null) : null;

  useEffect(() => {
    if (!selector) return;
    const el = findVisibleElement(selector);
    if (!el) return;

    el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });

    function update() {
      const target = findVisibleElement(selector!);
      setRect(target ? target.getBoundingClientRect() : null);
    }

    update();
    const raf = requestAnimationFrame(update);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [selector, tick]);

  useEffect(() => {
    if (!show) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") finish();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show]);

  function finish() {
    setDismissed(true);
    completeOnboarding();
  }

  function next() {
    if (stepIndex + 1 >= resolvedSteps.length) {
      finish();
      return;
    }
    setStepIndex((i) => i + 1);
    setTick((t) => t + 1);
  }

  function back() {
    setStepIndex((i) => Math.max(0, i - 1));
    setTick((t) => t + 1);
  }

  if (!show || !current) return null;

  const isFirst = stepIndex === 0;
  const isLast = stepIndex === resolvedSteps.length - 1;

  const tooltipStyle = (() => {
    if (!rect) {
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" } as const;
    }
    const spaceBelow = window.innerHeight - rect.bottom;
    const placeBelow = spaceBelow > 220 || rect.top < 220;
    const top = placeBelow ? rect.bottom + MARGIN : undefined;
    const bottom = !placeBelow ? window.innerHeight - rect.top + MARGIN : undefined;
    let left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
    left = Math.max(12, Math.min(left, window.innerWidth - TOOLTIP_WIDTH - 12));
    return {
      top,
      bottom,
      left,
      transform: "none",
    } as const;
  })();

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 transition-all duration-300"
        style={
          rect
            ? {
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.65)",
                top: rect.top - 6,
                left: rect.left - 6,
                width: rect.width + 12,
                height: rect.height + 12,
                borderRadius: 10,
                position: "fixed",
                border: "2px solid var(--signal)",
                pointerEvents: "none",
              }
            : { background: "rgba(0,0,0,0.65)" }
        }
      />

      <div
        className="fixed w-[320px] max-w-[calc(100vw-24px)] rounded-lg border border-border bg-surface-raised p-4 shadow-xl"
        style={tooltipStyle}
      >
        <p className="text-xs text-text-faint mb-1">
          {stepIndex + 1} / {resolvedSteps.length}
        </p>
        <h3 className="text-sm font-medium text-text mb-1.5">{current.step.title}</h3>
        <p className="text-sm text-text-muted leading-relaxed mb-4">{current.step.body}</p>
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={finish}
            className="text-xs text-text-faint hover:text-text transition-colors"
          >
            {labels.skip}
          </button>
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={back}
                className="text-sm px-3 py-1.5 rounded-md text-text-muted hover:text-text hover:bg-surface transition-colors"
              >
                {labels.back}
              </button>
            )}
            <button
              type="button"
              onClick={next}
              className="text-sm px-3 py-1.5 rounded-md bg-signal text-bg font-medium transition-opacity hover:opacity-90"
            >
              {isLast ? labels.done : labels.next}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
