import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  await prisma.visitState.upsert({
    where: { id: 1 },
    create: { id: 1 },
    update: { lastVisitedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
