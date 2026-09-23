import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<"/api/articles/[id]">,
) {
  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Nieprawidłowe zapytanie" }, { status: 400 });
  }

  const record = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};

  const data: Prisma.ArticleUpdateInput = {};
  if (typeof record.saved === "boolean") data.saved = record.saved;
  if (typeof record.read === "boolean") {
    data.read = record.read;
    if (record.read) data.readAt = new Date();
  }
  if (typeof record.dismissed === "boolean") {
    data.dismissed = record.dismissed;
    data.dismissedAt = record.dismissed ? new Date() : null;
  }

  try {
    const article = await prisma.article.update({ where: { id }, data });
    return NextResponse.json({
      saved: article.saved,
      read: article.read,
      dismissed: article.dismissed,
    });
  } catch {
    return NextResponse.json({ error: "Nie znaleziono artykułu" }, { status: 404 });
  }
}
