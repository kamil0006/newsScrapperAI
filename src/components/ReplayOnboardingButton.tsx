"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { resetOnboarding } from "@/lib/onboarding/actions";

export function ReplayOnboardingButton({ label }: { label: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    try {
      await resetOnboarding();
      router.push("/");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="text-sm px-3 py-1.5 rounded-md border border-border text-text-muted hover:text-text hover:bg-surface transition-colors disabled:opacity-50"
    >
      {label}
    </button>
  );
}
