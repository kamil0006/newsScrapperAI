import { NextRequest, NextResponse } from "next/server";
import { classifyPendingArticles } from "@/lib/ai/classify";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE_NAME } from "@/lib/i18n/locale";

export async function POST(req: NextRequest) {
  const cookieLocale = req.cookies.get(LOCALE_COOKIE_NAME)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

  try {
    const result = await classifyPendingArticles(200, locale);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
