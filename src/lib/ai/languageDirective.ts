import type { Locale } from "@/lib/i18n/locale";

// appended to the end of system prompts — the rest of the instructions can
// stay in Polish, the model understands it fine; only the OUTPUT language matters
export function languageDirective(locale: Locale): string {
  return locale === "en"
    ? "\n\nRespond in English, regardless of the language used above."
    : "\n\nOdpowiadaj po polsku.";
}
