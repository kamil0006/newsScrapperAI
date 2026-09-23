import { NextResponse } from "next/server";
import { fetchRssFeeds } from "@/lib/sources/rss";
import { saveArticles } from "@/lib/scrape";

export async function POST() {
  const { articles, errors } = await fetchRssFeeds();
  const result = await saveArticles(articles);
  return NextResponse.json({ ...result, fetched: articles.length, errors });
}
