import { cookies } from "next/headers";

export type Locale = "pl" | "en";
export const DEFAULT_LOCALE: Locale = "pl";
const COOKIE_NAME = "locale";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value === "en" ? "en" : DEFAULT_LOCALE;
}

export function isLocale(value: unknown): value is Locale {
  return value === "pl" || value === "en";
}

export { COOKIE_NAME as LOCALE_COOKIE_NAME };
