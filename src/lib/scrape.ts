import { prisma } from "@/lib/prisma";
import { isObviousPromo } from "@/lib/sources/promoFilter";
import type { NormalizedArticle } from "@/lib/sources/types";

const MAX_TITLE_LENGTH = 500;

export async function saveArticles(articles: NormalizedArticle[]) {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const article of articles) {
    if (isObviousPromo(article.title)) {
      skipped += 1;
      continue;
    }

    try {
      const existing = await prisma.article.findUnique({
        where: { url: article.url },
        select: { id: true },
      });

      if (existing) {
        await prisma.article.update({
          where: { url: article.url },
          // tylko sygnały ze źródła się odświeżają — klasyfikacja AI i stan
          // czytelnika (przeczytane/zapisane) zostają nietknięte
          data: {
            score: article.score,
            commentsCount: article.commentsCount,
          },
        });
        updated += 1;
      } else {
        await prisma.article.create({
          data: {
            sourceType: article.sourceType,
            sourceName: article.sourceName,
            externalId: article.externalId,
            url: article.url,
            title: article.title.slice(0, MAX_TITLE_LENGTH),
            content: article.content,
            score: article.score,
            commentsCount: article.commentsCount,
            publishedAt: article.publishedAt,
          },
        });
        created += 1;
      }
    } catch {
      // najczęściej wyścig przy równoczesnym scrapowaniu (ten sam URL
      // wstawiony przez inne żądanie między sprawdzeniem a zapisem) —
      // pomijamy ten jeden artykuł, reszta partii ma jechać dalej
      skipped += 1;
    }
  }

  return { created, updated, skipped };
}
