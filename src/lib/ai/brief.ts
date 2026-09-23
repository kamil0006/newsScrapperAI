import OpenAI from "openai";
import { visibleContentFilter } from "@/lib/contentFilter";
import { prisma } from "@/lib/prisma";

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const SYSTEM_PROMPT = `Piszesz krótki, rzeczowy przegląd dnia po polsku dla developera śledzącego AI, technologię i gry.

Jeden akapit, 3-5 zdań, bez wypunktowań i bez cytowania tytułów newsów dosłownie — syntetyzuj temat, wskaż co dominuje dziś w newsach i co jest najbardziej istotne. Ton: konkretny, bez lania wody, bez marketingowego zadęcia.`;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function generateDailyBrief(): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const top = await prisma.article.findMany({
    where: {
      classifiedAt: { not: null },
      duplicateOfId: null,
      dismissed: false,
      fetchedAt: { gte: since },
      ...visibleContentFilter(),
    },
    orderBy: [{ priority: "desc" }],
    take: 12,
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

  const content = response.choices[0]?.message.content?.trim();
  if (!content) return null;

  await prisma.dailyBrief.upsert({
    where: { date: todayKey() },
    create: { date: todayKey(), content },
    update: { content },
  });

  return content;
}

export async function getTodaysBrief(): Promise<string | null> {
  const row = await prisma.dailyBrief.findUnique({ where: { date: todayKey() } });
  return row?.content ?? null;
}
