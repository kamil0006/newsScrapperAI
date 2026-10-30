import { NextRequest, NextResponse } from "next/server";
import { isTheme, THEME_COOKIE_NAME } from "@/lib/theme";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const record = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const theme = isTheme(record.theme) ? record.theme : "dark";

  const res = NextResponse.json({ theme });
  res.cookies.set(THEME_COOKIE_NAME, theme, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return res;
}
