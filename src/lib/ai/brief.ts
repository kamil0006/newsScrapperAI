import OpenAI from "openai";
import { languageDirective } from "@/lib/ai/languageDirective";
import { CATEGORIES, type Category, categoryLabel } from "@/lib/categories";
import { visibleContentFilter } from "@/lib/contentFilter";
import type { Locale } from "@/lib/i18n/locale";
import { prisma } from "@/lib/prisma";

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const TOP_ARTICLES = 12;
// briefs are a per-day cache — a week of history is plenty
const KEEP_DAYS = 7;

// the reader's own topics go into the prompt, so a brief for someone
// following entertainment and science doesn't read like a tech newsletter
export function briefSystemPrompt(topics: string): string {
  return `Piszesz krótki, rzeczowy przegląd dnia dla osoby, która śledzi te tematy: ${topics}.

Jeden akapit, 3-5 zdań, bez wypunktowań i bez cytowania tytułów newsów dosłownie — syntetyzuj, wskaż co dominuje dziś w newsach i co jest najbardziej istotne. Jeśli newsy dotyczą kilku tematów, zaznacz najważniejsze z każdego, zamiast skupiać się tylko na jednym. Ton: konkretny, bez lania wody, bez marketingowego zadęcia.`;
}

export function visibleCategories(hidden: Category[]): Category[] {
  return CATEGORIES.filter((c) => !hidden.includes(c));
}

export function topicsList(categories: Category[], locale: Locale): string {
  return categories.map((c) => categoryLabel(c, locale)).join(", ");
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

// accounts with the same language and the same visible categories get the
// same brief, so it's generated once for all of them
export function briefKey(date: string, locale: Locale, categories: Category[]): string {
  return `${date}|${locale}|${[...categories].sort().join(",")}`;
}

async function generateBrief(categories: Category[], locale: Locale): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || categories.length === 0) return null;

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // shared per settings, not per account — so per-user dismissals don't filter it
  const top = await prisma.article.findMany({
    where: {
      AND: [
        { classifiedAt: { not: null }, duplicateOfId: null, fetchedAt: { gte: since } },
        { category: { in: categories } },
        visibleContentFilter(),
      ],
    },
    orderBy: [{ priority: "desc" }],
    take: TOP_ARTICLES,
    select: { title: true, category: true, priority: true, summary: true },
  });

  if (top.length === 0) return null;

  const client = new OpenAI({ apiKey });
  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: briefSystemPrompt(topicsList(categories, "pl")) + languageDirective(locale),
      },
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

  return response.choices[0]?.message.content?.trim() || null;
}

// today's brief for these settings — from the cache, or generated now
export async function getOrCreateDailyBrief(
  hiddenCategories: Category[],
  locale: Locale,
): Promise<string | null> {
  const categories = visibleCategories(hiddenCategories);
  const date = todayKey();
  const key = briefKey(date, locale, categories);

  const cached = await prisma.dailyBrief.findUnique({ where: { key } });
  if (cached) return cached.content;

  const content = await generateBrief(categories, locale);
  if (!content) return null;

  // upsert: two people with the same settings may open the page at once
  await prisma.dailyBrief.upsert({
    where: { key },
    create: { key, date, content },
    update: { content },
  });
  return content;
}

// after a scrape the cached briefs are out of date — drop today's (each is
// regenerated on its next view) and anything older than a week
export async function invalidateDailyBriefs(): Promise<void> {
  const cutoff = new Date(Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  await prisma.dailyBrief.deleteMany({
    where: { OR: [{ date: todayKey() }, { date: { lt: cutoff } }] },
  });
}
