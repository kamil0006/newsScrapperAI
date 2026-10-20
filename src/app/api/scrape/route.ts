import { NextRequest, NextResponse } from "next/server";
import { generateDailyBrief } from "@/lib/ai/brief";
import { classifyPendingArticles } from "@/lib/ai/classify";
import { markDuplicates } from "@/lib/dedupe";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE_NAME } from "@/lib/i18n/locale";
import { fetchHackerNewsTopStories } from "@/lib/sources/hackernews";
import { fetchRssFeeds } from "@/lib/sources/rss";
import { saveArticles } from "@/lib/scrape";
import { linkThreads } from "@/lib/threads";

export async function POST(req: NextRequest) {
  const cookieLocale = req.cookies.get(LOCALE_COOKIE_NAME)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;
  const errors: string[] = [];

  const [hnResult, rssResult] = await Promise.allSettled([
    fetchHackerNewsTopStories(30),
    fetchRssFeeds(),
  ]);

  const articles = [
    ...(hnResult.status === "fulfilled" ? hnResult.value : []),
    ...(rssResult.status === "fulfilled" ? rssResult.value.articles : []),
  ];

  if (hnResult.status === "rejected") {
    errors.push(`Hacker News: ${hnResult.reason}`);
  }
  if (rssResult.status === "fulfilled") {
    errors.push(...rssResult.value.errors);
  } else {
    errors.push(`RSS: ${rssResult.reason}`);
  }

  const saved = await saveArticles(articles);

  // classification must run before duplicate detection — we compare
  // AI summaries, which don't exist yet for freshly saved articles
  let classified = 0;
  let deepened = 0;
  let tokensUsed = { promptTokens: 0, completionTokens: 0 };
  try {
    const result = await classifyPendingArticles(60, locale);
    classified = result.classified;
    deepened = result.deepened;
    tokensUsed = result.tokensUsed;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nieznany błąd";
    errors.push(`Klasyfikacja AI: ${message}`);
  }

  let duplicates = 0;
  let boosted = 0;
  try {
    const result = await markDuplicates();
    duplicates = result.marked;
    boosted = result.boosted;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nieznany błąd";
    errors.push(`Wykrywanie duplikatów: ${message}`);
  }

  let threaded = 0;
  try {
    const result = await linkThreads();
    threaded = result.linked;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nieznany błąd";
    errors.push(`Wątki tematyczne: ${message}`);
  }

  let brief = false;
  try {
    brief = (await generateDailyBrief(locale)) !== null;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nieznany błąd";
    errors.push(`Przegląd dnia: ${message}`);
  }

  return NextResponse.json({
    ...saved,
    classified,
    deepened,
    tokensUsed,
    duplicates,
    boosted,
    threaded,
    brief,
    errors,
  });
}
