import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const userId = await verifySessionToken(req.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.visitState.upsert({
    where: { userId },
    create: { userId },
    update: { lastVisitedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
