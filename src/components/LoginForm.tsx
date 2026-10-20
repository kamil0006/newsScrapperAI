"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, type AuthState } from "@/lib/auth/actions";
import type { Dictionary } from "@/lib/i18n/dictionary";

export function LoginForm({ dict }: { dict: Dictionary["login"] }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(login, undefined);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input
        type="email"
        name="email"
        placeholder={dict.emailPlaceholder}
        autoFocus
        required
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-faint focus:outline-none focus:border-signal transition-colors"
      />
      <input
        type="password"
        name="password"
        placeholder={dict.passwordPlaceholder}
        required
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-faint focus:outline-none focus:border-signal transition-colors"
      />
      {state?.error && <p className="text-sm text-priority-5">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-signal text-bg text-sm font-medium py-2 transition-opacity disabled:opacity-60"
      >
        {pending ? dict.submitting : dict.submit}
      </button>
      <p className="text-center text-sm text-text-faint">
        {dict.noAccount}{" "}
        <Link href="/signup" className="text-text hover:text-signal transition-colors">
          {dict.signupLink}
        </Link>
      </p>
    </form>
  );
}
