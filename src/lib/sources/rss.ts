import Parser from "rss-parser";
import type { Category } from "@/lib/categories";
import type { NormalizedArticle } from "@/lib/sources/types";

// `category` marks feeds that cover a single topic. If every user hides that
// category, the feed isn't fetched at all. Mixed feeds (no category) always are.
type FeedConfig = { url: string; sourceName: string; category?: Category };

const FEEDS: FeedConfig[] = [
  { url: "https://feeds.arstechnica.com/arstechnica/index", sourceName: "Ars Technica" },
  { url: "https://techcrunch.com/feed/", sourceName: "TechCrunch" },
  { url: "https://www.technologyreview.com/feed/", sourceName: "MIT Technology Review" },
  { url: "https://www.pcgamer.com/rss/", sourceName: "PC Gamer", category: "Gaming" },
  { url: "https://www.rockpapershotgun.com/feed", sourceName: "Rock Paper Shotgun", category: "Gaming" },
  { url: "https://feeds.ign.com/ign/games-all", sourceName: "IGN", category: "Gaming" },
  { url: "https://www.gamesindustry.biz/feed", sourceName: "GamesIndustry.biz", category: "Gaming" },
  { url: "https://lobste.rs/rss", sourceName: "Lobsters" },
  { url: "https://dev.to/feed/tag/ai", sourceName: "Dev.to" },
  { url: "https://www.wired.com/feed/rss", sourceName: "Wired" },
  { url: "https://www.eurogamer.net/feed", sourceName: "Eurogamer", category: "Gaming" },
  { url: "https://www.polygon.com/rss/index.xml", sourceName: "Polygon", category: "Gaming" },
  { url: "https://kotaku.com/rss", sourceName: "Kotaku", category: "Gaming" },

  // business/startups/finance
  { url: "https://techcrunch.com/category/startups/feed/", sourceName: "TechCrunch Startups", category: "Business" },
  { url: "https://www.cnbc.com/id/10001147/device/rss/rss.html", sourceName: "CNBC", category: "Business" },
  { url: "https://feeds.content.dowjones.io/public/rss/mw_topstories", sourceName: "MarketWatch", category: "Business" },

  // science/space
  { url: "https://www.nasa.gov/feed/", sourceName: "NASA", category: "Science" },
  { url: "https://www.space.com/feeds/all", sourceName: "Space.com", category: "Science" },

  // entertainment/movies/TV
  { url: "https://www.hollywoodreporter.com/feed/", sourceName: "The Hollywood Reporter", category: "Entertainment" },
  { url: "https://variety.com/feed/", sourceName: "Variety", category: "Entertainment" },
  { url: "https://collider.com/feed/", sourceName: "Collider", category: "Entertainment" },
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

function activeFeeds(skipCategories: readonly Category[]): FeedConfig[] {
  return FEEDS.filter((feed) => !feed.category || !skipCategories.includes(feed.category));
}

// names of single-topic sources for the given categories — used to keep
// already-saved articles from those feeds out of the classification queue
export function sourceNamesForCategories(categories: readonly Category[]): string[] {
  return FEEDS.filter((feed) => feed.category && categories.includes(feed.category)).map(
    (feed) => feed.sourceName,
  );
}

export async function fetchRssFeeds(skipCategories: readonly Category[] = []): Promise<{
  articles: NormalizedArticle[];
  errors: string[];
}> {
  const feeds = activeFeeds(skipCategories);
  const results = await Promise.allSettled(feeds.map(fetchFeed));

  const articles: NormalizedArticle[] = [];
  const errors: string[] = [];

  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      articles.push(...result.value);
    } else {
      errors.push(`${feeds[i].sourceName}: ${result.reason}`);
    }
  });

  return { articles, errors };
}
