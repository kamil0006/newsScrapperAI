import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { CATEGORIES, toCategory } from "@/lib/categories";
import { extractArticleText } from "@/lib/extract";

// batche większe niż strukturalnie potrzeba — sam prompt systemowy (kryteria
// oceny) jest wysyłany raz na batch, więc im mniej wywołań, tym mniej
// powtórzonych tokenów bez żadnego wpływu na jakość pojedynczej oceny
const BATCH_SIZE = 20;
const DEEP_BATCH_SIZE = 5;
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

// artykuły, które po pierwszym rzucie (sam tytuł) wyglądają na tyle obiecująco,
// że warto pobrać ich pełną treść i doklasyfikować dokładniej
const DEEPEN_PRIORITY_THRESHOLD = 3;
const MAX_DEEPEN_PER_RUN = 15;
// zgrubna selekcja z tytułu — dokładność i tak dobija się w etapie pogłębionym,
// więc krótszy excerpt tu nie kosztuje jakości
const SHALLOW_EXCERPT_CHARS = 350;
const DEEP_EXCERPT_CHARS = 3000;
const RICH_CONTENT_THRESHOLD = 300;
const MAX_FEEDBACK_EXAMPLES = 20;

const QUALITY_LABELS = ["rzetelny", "przeciętny", "lanie_wody"] as const;
type QualityLabel = (typeof QUALITY_LABELS)[number];

const LANGUAGES = ["pl", "en", "other"] as const;
type Language = (typeof LANGUAGES)[number];

const BASE_SYSTEM_PROMPT = `Oceniasz newsy dla developera, który śledzi AI, technologię i gry, i nie ma czasu przeglądać wszystkiego sam.

Dla każdego newsa ustal:
- category: jedna z ${CATEGORIES.join(", ")} — "Inne" tylko gdy naprawdę nie pasuje do AI/Gaming/Tech.
- priority: liczba całkowita 1-5, gdzie 5 = koniecznie przeczytaj (przełomowe, unikalne, realnie zmienia coś w branży), 3 = warto rzucić okiem, 1 = pomiń (marketing, drobna aktualizacja, mało istotne, duplikat popularnego newsa).
- summary: 1-2 zdania po polsku, konkretnie o co chodzi — bez lania wody, bez powtarzania tytułu.
- quality: ocena rzetelności treści — TYLKO jeśli w excerpt masz realny fragment artykułu (nie sam tytuł, nie pusty/krótszy niż ok. 300 znaków tekst). Jeśli podstaw brak, zwróć quality: null i qualityNote: null. Gdy masz realną treść, wybierz jedną z:
  - "rzetelny": konkretne fakty, źródła, liczby, cytaty — nie tylko ogólniki
  - "przeciętny": ma jakąś treść, ale płytko albo ogólnikowo
  - "lanie_wody": głównie frazesy, powtórzenia, sztuczne wydłużanie, brak konkretów — wygląda jak treść pisana pod SEO albo bez realnej wartości
  qualityNote: jedno krótkie zdanie uzasadnienia (null, jeśli quality jest null).
- sponsored: true jeśli tytuł/treść to reklama, artykuł sponsorowany, afiliacyjny content (kody rabatowe, kupony, linki partnerskie) albo natywna reklama pod płaszczykiem newsa. Inaczej false.
- language: język ORYGINAŁU newsa (tytułu/treści, NIE Twojego streszczenia) — "pl", "en", albo "other" dla każdego innego języka.

Odpowiadaj wyłącznie w formacie JSON zgodnym ze schematem.`;

async function buildFeedbackContext(): Promise<string> {
  const dismissed = await prisma.article.findMany({
    where: { dismissed: true },
    orderBy: { dismissedAt: "desc" },
    take: MAX_FEEDBACK_EXAMPLES,
    select: { title: true, category: true },
  });

  if (dismissed.length === 0) return "";

  const examples = dismissed
    .map((d) => `- [${d.category ?? "?"}] ${d.title}`)
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

function clampPriority(value: number): number {
  return Math.min(5, Math.max(1, Math.round(value)));
}

// lanie wody nie powinno być "koniecznie przeczytaj" niezależnie od tematu
function applyQualityClamp(priority: number, quality: QualityLabel | null): number {
  return quality === "lanie_wody" ? Math.min(priority, 2) : priority;
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

  // pobieranie pełnej treści zostaje per-artykuł (to zwykły fetch, nie
  // wywołanie AI), ale klasyfikujemy grupami — jedno wywołanie modelu na
  // kilka artykułów naraz zamiast osobno, żeby nie powtarzać promptu
  // systemowego przy każdym pojedynczym artykule
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

export async function classifyPendingArticles(limit = 60) {
  const client = getClient();
  const systemPrompt = BASE_SYSTEM_PROMPT + (await buildFeedbackContext());

  const pending = await prisma.article.findMany({
    where: { classifiedAt: null },
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
      // przy realnej treści już na starcie (self-posty HN) model ocenia
      // rzetelność już teraz — przy samym tytule prompt każe mu zwrócić null
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
