import Parser from "rss-parser";
import type { NormalizedArticle } from "@/lib/sources/types";

type FeedConfig = { url: string; sourceName: string };

const FEEDS: FeedConfig[] = [
  { url: "https://feeds.arstechnica.com/arstechnica/index", sourceName: "Ars Technica" },
  { url: "https://techcrunch.com/feed/", sourceName: "TechCrunch" },
  { url: "https://www.technologyreview.com/feed/", sourceName: "MIT Technology Review" },
  { url: "https://www.pcgamer.com/rss/", sourceName: "PC Gamer" },
  { url: "https://www.rockpapershotgun.com/feed", sourceName: "Rock Paper Shotgun" },
  { url: "https://feeds.ign.com/ign/games-all", sourceName: "IGN" },
  { url: "https://www.gamesindustry.biz/feed", sourceName: "GamesIndustry.biz" },
  { url: "https://lobste.rs/rss", sourceName: "Lobsters" },
  { url: "https://dev.to/feed/tag/ai", sourceName: "Dev.to" },
  { url: "https://www.wired.com/feed/rss", sourceName: "Wired" },
  { url: "https://www.eurogamer.net/feed", sourceName: "Eurogamer" },
  { url: "https://www.polygon.com/rss/index.xml", sourceName: "Polygon" },
  { url: "https://kotaku.com/rss", sourceName: "Kotaku" },
];

const MAX_ITEMS_PER_FEED = 15;

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; newsScrapperAI/0.1; personal news reader)",
  },
});

async function fetchFeed(feed: FeedConfig): Promise<NormalizedArticle[]> {
  const parsed = await parser.parseURL(feed.url);

  return (parsed.items ?? [])
    .slice(0, MAX_ITEMS_PER_FEED)
    .filter((item) => item.link && item.title)
    .map((item) => ({
      sourceType: "rss",
      sourceName: feed.sourceName,
      externalId: item.guid ?? item.link!,
      url: item.link!,
      title: item.title!,
      content: (item.contentSnippet ?? item.content ?? null)?.slice(0, 2000) ?? null,
      score: null,
      commentsCount: null,
      publishedAt: item.isoDate
        ? new Date(item.isoDate)
        : item.pubDate
          ? new Date(item.pubDate)
          : null,
    }));
}

export async function fetchRssFeeds(): Promise<{
  articles: NormalizedArticle[];
  errors: string[];
}> {
  const results = await Promise.allSettled(FEEDS.map(fetchFeed));

  const articles: NormalizedArticle[] = [];
  const errors: string[] = [];

  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      articles.push(...result.value);
    } else {
      errors.push(`${FEEDS[i].sourceName}: ${result.reason}`);
    }
  });

  return { articles, errors };
}
