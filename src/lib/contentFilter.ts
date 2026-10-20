import type { Prisma } from "@/generated/prisma/client";

// hard content filters — applied everywhere (not just the main view),
// since these are objective content rules, not a reader preference like
// saved/read. `language: null` (not yet classified) is not excluded —
// only an explicit "other" hides the article.
export function visibleContentFilter(): Prisma.ArticleWhereInput {
  return {
    sponsored: false,
    OR: [{ language: null }, { language: { not: "other" } }],
  };
}
