export type NormalizedArticle = {
  sourceType: string;
  sourceName: string;
  externalId: string;
  url: string;
  title: string;
  content: string | null;
  score: number | null;
  commentsCount: number | null;
  publishedAt: Date | null;
};
