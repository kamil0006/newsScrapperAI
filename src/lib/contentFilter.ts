import type { Prisma } from "@/generated/prisma/client";

// twarde filtry treści — stosowane wszędzie (nie tylko w głównym widoku),
// bo to obiektywne reguły dot. treści, a nie preferencja czytelnika jak
// zapisane/przeczytane. `language: null` (jeszcze nie sklasyfikowany) nie
// jest wykluczany — dopiero jawne "other" chowa artykuł.
export function visibleContentFilter(): Prisma.ArticleWhereInput {
  return {
    sponsored: false,
    OR: [{ language: null }, { language: { not: "other" } }],
  };
}
