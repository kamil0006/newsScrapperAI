import { NextRequest, NextResponse } from "next/server";
import { isLocale, LOCALE_COOKIE_NAME } from "@/lib/i18n/locale";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const record = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const locale = isLocale(record.locale) ? record.locale : "pl";

  const res = NextResponse.json({ locale });
  res.cookies.set(LOCALE_COOKIE_NAME, locale, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return res;
}
