import { cookies } from "next/headers";

export type Theme = "dark" | "light";
export const DEFAULT_THEME: Theme = "dark";
const COOKIE_NAME = "theme";

export async function getTheme(): Promise<Theme> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value === "light" ? "light" : DEFAULT_THEME;
}

export function isTheme(value: unknown): value is Theme {
  return value === "dark" || value === "light";
}

export { COOKIE_NAME as THEME_COOKIE_NAME };
