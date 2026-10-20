import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { languageDirective } from "@/lib/ai/languageDirective";
import { applyQualityClamp, clampPriority } from "@/lib/ai/priorityRules";
import { CATEGORIES, toCategory } from "@/lib/categories";
import { extractArticleText } from "@/lib/extract";
import type { Locale } from "@/lib/i18n/locale";

// batches larger than structurally needed — the system prompt (grading
// criteria) itself is sent once per batch, so fewer calls means fewer
// repeated tokens with no impact on the quality of any single rating
const BATCH_SIZE = 20;
const DEEP_BATCH_SIZE = 5;
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

// articles that look promising enough after the first pass (title only)
// to be worth fetching in full and re-classifying more thoroughly
const DEEPEN_PRIORITY_THRESHOLD = 3;
const MAX_DEEPEN_PER_RUN = 15;
// rough triage from the title — accuracy gets refined in the deep pass
// anyway, so a shorter excerpt here doesn't cost quality
const SHALLOW_EXCERPT_CHARS = 350;
const DEEP_EXCERPT_CHARS = 3000;
const RICH_CONTENT_THRESHOLD = 300;
const MAX_FEEDBACK_EXAMPLES = 20;

const QUALITY_LABELS = ["rzetelny", "przeciętny", "lanie_wody"] as const;
type QualityLabel = (typeof QUALITY_LABELS)[number];

const LANGUAGES = ["pl", "en", "other"] as const;
type Language = (typeof LANGUAGES)[number];

const BASE_SYSTEM_PROMPT = `Oceniasz newsy dla osób śledzących AI, technologię, gry, biznes/startupy, naukę i rozrywkę (filmy/seriale), które nie mają czasu przeglądać wszystkiego samemu.

Dla każdego newsa ustal:
- category: jedna z ${CATEGORIES.join(", ")}. Zasady wyboru:
  - "AI": konkretnie o sztucznej inteligencji — modele, badania AI, firmy/produkty AI. AI-research ma priorytet nad "Science".
  - "Gaming": branża gier wideo — recenzje, aktualizacje, wydania.
  - "Tech": ogólna technologia, która nie pasuje lepiej do "AI" czy "Gaming" — sprzęt, oprogramowanie, internet, cyberbezpieczeństwo.
  - "Business": startupy, finansowanie, rynki, decyzje korporacyjne/biznesowe — także spółek technologicznych, jeśli news jest głównie o pieniądzach/strategii, a nie o samym produkcie.
  - "Science": odkrycia naukowe, kosmos, badania NIE związane z AI.
  - "Entertainment": filmy, seriale, streaming, popkultura.
  - "Inne": tylko gdy naprawdę nic z powyższych nie pasuje.
- priority: liczba całkowita 1-5, gdzie 5 = koniecznie przeczytaj (przełomowe, unikalne, realnie zmienia coś w branży), 3 = warto rzucić okiem, 1 = pomiń (marketing, drobna aktualizacja, mało istotne, duplikat popularnego newsa).
- summary: 1-2 zdania, konkretnie o co chodzi — bez lania wody, bez powtarzania tytułu.
- quality: ocena rzetelności treści — TYLKO jeśli w excerpt masz realny fragment artykułu (nie sam tytuł, nie pusty/krótszy niż ok. 300 znaków tekst). Jeśli podstaw brak, zwróć quality: null i qualityNote: null. Gdy masz realną treść, wybierz jedną z:
  - "rzetelny": konkretne fakty, źródła, liczby, cytaty — nie tylko ogólniki
  - "przeciętny": ma jakąś treść, ale płytko albo ogólnikowo
  - "lanie_wody": głównie frazesy, powtórzenia, sztuczne wydłużanie, brak konkretów — wygląda jak treść pisana pod SEO albo bez realnej wartości
  qualityNote: jedno krótkie zdanie uzasadnienia (null, jeśli quality jest null).
- sponsored: true jeśli tytuł/treść to reklama, artykuł sponsorowany, afiliacyjny content (kody rabatowe, kupony, linki partnerskie) albo natywna reklama pod płaszczykiem newsa. Inaczej false.
- language: język ORYGINAŁU newsa (tytułu/treści, NIE Twojego streszczenia) — "pl", "en", albo "other" dla każdego innego języka.

Odpowiadaj wyłącznie w formacie JSON zgodnym ze schematem.`;

async function buildFeedbackContext(): Promise<string> {
  // dismissals are personal now (per account), but the classifier is shared —
  // treat any user's dismissal as a signal, same as before multi-user accounts
  const dismissed = await prisma.articleState.findMany({
    where: { dismissed: true },
    orderBy: { dismissedAt: "desc" },
    take: MAX_FEEDBACK_EXAMPLES,
    select: { article: { select: { title: true, category: true } } },
  });

  if (dismissed.length === 0) return "";

  const examples = dismissed
    .map((d) => `- [${d.article.category ?? "?"}] ${d.article.title}`)
    .join("\n");

  return `\n\nUżytkownik wcześniej oznaczył jako nieistotne newsy podobne do tych — jeśli trafi się coś bliskiego tematycznie, obniż priorytet:\n${examples}`;
}

type PendingArticle = {
  id: string;
  title: string;
  sourceName: string;
  content: string | null;
  url: string;
};

type ClassificationResult = {
  id: string;
  category: string;
  priority: number;
  summary: string;
  quality: QualityLabel | null;
  qualityNote: string | null;
  sponsored: boolean;
  language: Language;
};

type TokenUsage = { promptTokens: number; completionTokens: number };

function addUsage(a: TokenUsage, b: TokenUsage): TokenUsage {
  return {
    promptTokens: a.promptTokens + b.promptTokens,
    completionTokens: a.completionTokens + b.completionTokens,
  };
}

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Brak OPENAI_API_KEY w .env");
  }
  return new OpenAI({ apiKey });
}

async function classifyBatch(
  client: OpenAI,
  batch: PendingArticle[],
  excerptChars: number,
  systemPrompt: string,
): Promise<{ results: ClassificationResult[]; usage: TokenUsage }> {
  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: JSON.stringify(
          batch.map((a) => ({
            id: a.id,
            title: a.title,
            source: a.sourceName,
            excerpt: a.content?.slice(0, excerptChars) ?? null,
          })),
        ),
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "article_classifications",
        strict: true,
        schema: {
          type: "object",
          properties: {
            results: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  category: { type: "string", enum: CATEGORIES },
                  priority: { type: "integer", minimum: 1, maximum: 5 },
                  summary: { type: "string" },
                  quality: { type: ["string", "null"], enum: [...QUALITY_LABELS, null] },
                  qualityNote: { type: ["string", "null"] },
                  sponsored: { type: "boolean" },
                  language: { type: "string", enum: LANGUAGES },
                },
                required: [
                  "id",
                  "category",
                  "priority",
                  "summary",
                  "quality",
                  "qualityNote",
                  "sponsored",
                  "language",
                ],
                additionalProperties: false,
              },
            },
          },
          required: ["results"],
          additionalProperties: false,
        },
      },
    },
  });

  const raw = response.choices[0]?.message.content ?? "{}";
  const parsed = JSON.parse(raw) as { results: ClassificationResult[] };

  return {
    results: parsed.results,
    usage: {
      promptTokens: response.usage?.prompt_tokens ?? 0,
      completionTokens: response.usage?.completion_tokens ?? 0,
    },
  };
}

async function deepenArticles(
  client: OpenAI,
  candidates: { article: PendingArticle; priority: number }[],
  systemPrompt: string,
): Promise<{ deepened: number; usage: TokenUsage }> {
  const ordered = [...candidates]
    .sort((a, b) => b.priority - a.priority)
    .slice(0, MAX_DEEPEN_PER_RUN)
    .map((c) => c.article);

  let deepened = 0;
  let usage: TokenUsage = { promptTokens: 0, completionTokens: 0 };

  // fetching full text stays per-article (that's a plain fetch, not an
  // AI call), but classification runs in groups — one model call for
  // several articles at once instead of one each, to avoid repeating the
  // system prompt for every single article
  for (let i = 0; i < ordered.length; i += DEEP_BATCH_SIZE) {
    const group = ordered.slice(i, i + DEEP_BATCH_SIZE);

    const withText = await Promise.all(
      group.map(async (candidate): Promise<PendingArticle | null> => {
        const fullText = await extractArticleText(candidate.url);
        return fullText ? { ...candidate, content: fullText } : null;
      }),
    );
    const readable = withText.filter((c): c is PendingArticle => c !== null);
    if (readable.length === 0) continue;

    const { results, usage: batchUsage } = await classifyBatch(
      client,
      readable,
      DEEP_EXCERPT_CHARS,
      systemPrompt,
    );
    usage = addUsage(usage, batchUsage);

    for (const result of results) {
      const source = readable.find((a) => a.id === result.id);
      if (!source) continue;

      const priority = applyQualityClamp(clampPriority(result.priority), result.quality);

      await prisma.article.update({
        where: { id: result.id },
        data: {
          category: toCategory(result.category),
          priority,
          worthReading: priority >= 4,
          summary: result.summary,
          content: source.content,
          qualityLabel: result.quality,
          qualityNote: result.qualityNote,
          sponsored: result.sponsored,
          language: result.language,
        },
      });
      deepened += 1;
    }
  }

  return { deepened, usage };
}

export async function classifyPendingArticles(limit = 60, locale: Locale = "pl") {
  const client = getClient();
  const systemPrompt =
    BASE_SYSTEM_PROMPT + (await buildFeedbackContext()) + languageDirective(locale);

  // newest first — after a long gap, a backlog of old articles shouldn't
  // delay classifying today's news behind it
  const pending = await prisma.article.findMany({
    where: { classifiedAt: null },
    orderBy: { publishedAt: "desc" },
    take: limit,
    select: { id: true, title: true, sourceName: true, content: true, url: true },
  });

  let classified = 0;
  let usage: TokenUsage = { promptTokens: 0, completionTokens: 0 };
  const deepenCandidates: { article: PendingArticle; priority: number }[] = [];

  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch = pending.slice(i, i + BATCH_SIZE);
    const { results, usage: batchUsage } = await classifyBatch(
      client,
      batch,
      SHALLOW_EXCERPT_CHARS,
      systemPrompt,
    );
    usage = addUsage(usage, batchUsage);

    for (const result of results) {
      const source = batch.find((a) => a.id === result.id);
      if (!source) continue;

      const hasRichContent = (source.content?.length ?? 0) > RICH_CONTENT_THRESHOLD;
      // when real content is already present up front (HN self-posts), the
      // model rates quality right away — with just a title, the prompt tells
      // it to return null
      const priority = applyQualityClamp(clampPriority(result.priority), result.quality);

      await prisma.article.update({
        where: { id: result.id },
        data: {
          category: toCategory(result.category),
          priority,
          worthReading: priority >= 4,
          summary: result.summary,
          classifiedAt: new Date(),
          qualityLabel: hasRichContent ? result.quality : null,
          qualityNote: hasRichContent ? result.qualityNote : null,
          sponsored: result.sponsored,
          language: result.language,
        },
      });
      classified += 1;

      if (priority >= DEEPEN_PRIORITY_THRESHOLD && !hasRichContent) {
        deepenCandidates.push({ article: source, priority });
      }
    }
  }

  const deepenResult = await deepenArticles(client, deepenCandidates, systemPrompt);
  usage = addUsage(usage, deepenResult.usage);

  return {
    classified,
    deepened: deepenResult.deepened,
    pending: pending.length,
    tokensUsed: usage,
  };
}
