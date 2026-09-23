import { NextResponse } from "next/server";
import { classifyPendingArticles } from "@/lib/ai/classify";

export async function POST() {
  try {
    const result = await classifyPendingArticles(200);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nieznany błąd";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
