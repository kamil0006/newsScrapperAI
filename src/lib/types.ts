import type { Category } from "@/lib/categories";

export type ArticleListItem = {
  id: string;
  url: string;
  title: string;
  summary: string | null;
  sourceName: string;
  category: Category;
  priority: number | null;
  publishedAt: Date | null;
  read: boolean;
  saved: boolean;
  consensusSources: number;
  qualityLabel: string | null;
  qualityNote: string | null;
  threadId: string | null;
  threadCount: number;
};
