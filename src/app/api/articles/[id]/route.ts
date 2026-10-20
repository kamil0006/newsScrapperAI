import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";
import { dictionaries } from "@/lib/i18n/dictionary";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE_NAME } from "@/lib/i18n/locale";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<"/api/articles/[id]">,
) {
  const cookieLocale = req.cookies.get(LOCALE_COOKIE_NAME)?.value;
  const dict = dictionaries[isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE];

  const userId = await verifySessionToken(req.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!userId) {
    return NextResponse.json({ error: dict.errors.invalidRequest }, { status: 401 });
  }

  const { id: articleId } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: dict.errors.invalidRequest }, { status: 400 });
  }

  const record = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};

  const data: {
    saved?: boolean;
    read?: boolean;
    readAt?: Date | null;
    dismissed?: boolean;
    dismissedAt?: Date | null;
  } = {};
  if (typeof record.saved === "boolean") data.saved = record.saved;
  if (typeof record.read === "boolean") {
    data.read = record.read;
    if (record.read) data.readAt = new Date();
  }
  if (typeof record.dismissed === "boolean") {
    data.dismissed = record.dismissed;
    data.dismissedAt = record.dismissed ? new Date() : null;
  }

  const article = await prisma.article.findUnique({ where: { id: articleId }, select: { id: true } });
  if (!article) {
    return NextResponse.json({ error: dict.errors.articleNotFound }, { status: 404 });
  }

  const state = await prisma.articleState.upsert({
    where: { userId_articleId: { userId, articleId } },
    create: { userId, articleId, ...data },
    update: data,
  });

  return NextResponse.json({ saved: state.saved, read: state.read, dismissed: state.dismissed });
}
