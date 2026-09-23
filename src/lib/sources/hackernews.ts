import type { NormalizedArticle } from "@/lib/sources/types";

const HN_API = "https://hacker-news.firebaseio.com/v0";

type HNItem = {
  id: number;
  type: "story" | "job" | "poll" | "comment" | "pollopt";
  title?: string;
  url?: string;
  text?: string;
  score?: number;
  descendants?: number;
  time?: number;
  dead?: boolean;
  deleted?: boolean;
};

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${HN_API}/${path}`);
  if (!res.ok) {
    throw new Error(`Hacker News API error (${res.status}) dla ${path}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchHackerNewsTopStories(
  limit = 30,
): Promise<NormalizedArticle[]> {
  const ids = await fetchJson<number[]>("topstories.json");
  const items = await Promise.all(
    ids.slice(0, limit).map((id) => fetchJson<HNItem>(`item/${id}.json`)),
  );

  return items
    .filter((item): item is HNItem => Boolean(item))
    .filter((item) => item.type === "story" && !item.dead && !item.deleted)
    .map((item) => ({
      sourceType: "hackernews",
      sourceName: "Hacker News",
      externalId: String(item.id),
      url: item.url ?? `https://news.ycombinator.com/item?id=${item.id}`,
      title: item.title ?? "(bez tytułu)",
      content: item.text ?? null,
      score: item.score ?? null,
      commentsCount: item.descendants ?? null,
      publishedAt: item.time ? new Date(item.time * 1000) : null,
    }));
}
