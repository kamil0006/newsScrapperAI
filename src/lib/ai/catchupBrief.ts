import OpenAI from "openai";
import { visibleContentFilter } from "@/lib/contentFilter";
import { prisma } from "@/lib/prisma";

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const SYSTEM_PROMPT = `Piszesz krótkie podsumowanie "co przegapiłeś" po polsku dla developera, który nie zaglądał do newsów (AI, technologia, gry) od jakiegoś czasu.

Jeden akapit, 3-5 zdań, bez wypunktowań, bez cytowania tytułów dosłownie. Skup się na tym, co najważniejsze — pomiń drobiazgi. Ton: konkretny, rzeczowy, jakbyś wprowadzał kogoś w temat po jego nieobecności.`;

export async function generateCatchUpBrief(since: Date): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const top = await prisma.article.findMany({
    where: {
      AND: [
        { classifiedAt: { not: null }, duplicateOfId: null, dismissed: false },
        visibleContentFilter(),
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
      { role: "system", content: SYSTEM_PROMPT },
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
