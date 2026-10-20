import OpenAI from "openai";
import { languageDirective } from "@/lib/ai/languageDirective";
import type { Category } from "@/lib/categories";
import { visibleCategoriesFilter } from "@/lib/categoryPrefs";
import { visibleContentFilter } from "@/lib/contentFilter";
import type { Locale } from "@/lib/i18n/locale";
import { prisma } from "@/lib/prisma";

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const SYSTEM_PROMPT = `Piszesz krótkie podsumowanie "co przegapiłeś" dla developera, który nie zaglądał do newsów (AI, technologia, gry) od jakiegoś czasu.

Jeden akapit, 3-5 zdań, bez wypunktowań, bez cytowania tytułów dosłownie. Skup się na tym, co najważniejsze — pomiń drobiazgi. Ton: konkretny, rzeczowy, jakbyś wprowadzał kogoś w temat po jego nieobecności.`;

export async function generateCatchUpBrief(
  userId: string,
  since: Date,
  locale: Locale = "pl",
  hiddenCategories: Category[] = [],
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const top = await prisma.article.findMany({
    where: {
      AND: [
        { classifiedAt: { not: null }, duplicateOfId: null },
        { NOT: { articleStates: { some: { userId, dismissed: true } } } },
        visibleContentFilter(),
        visibleCategoriesFilter(hiddenCategories),
        {
          OR: [
            { publishedAt: { gte: since } },
            { publishedAt: null, fetchedAt: { gte: since } },
          ],
        },
      ],
    },
    orderBy: [{ priority: "desc" }],
    take: 15,
    select: { title: true, category: true, priority: true, summary: true },
  });

  if (top.length === 0) return null;

  const client = new OpenAI({ apiKey });
  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT + languageDirective(locale) },
      {
        role: "user",
        content: JSON.stringify(
          top.map((a) => ({
            title: a.title,
            category: a.category,
            priority: a.priority,
            summary: a.summary,
          })),
        ),
      },
    ],
  });

  return response.choices[0]?.message.content?.trim() ?? null;
}
