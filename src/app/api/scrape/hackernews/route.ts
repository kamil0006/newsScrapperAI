import { NextResponse } from "next/server";
import { fetchHackerNewsTopStories } from "@/lib/sources/hackernews";
import { saveArticles } from "@/lib/scrape";

export async function POST() {
  try {
    const articles = await fetchHackerNewsTopStories(30);
    const result = await saveArticles(articles);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nieznany błąd";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
