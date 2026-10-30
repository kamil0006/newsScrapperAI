import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { languageDirective } from "@/lib/ai/languageDirective";
import { applyQualityClamp, clampPriority } from "@/lib/ai/priorityRules";
import { titleEchoMatches } from "@/lib/ai/titleEcho";
import { CATEGORIES, toCategory } from "@/lib/categories";
import { pendingClassificationFilter, skipStaleUnclassified } from "@/lib/classificationScope";
import { extractArticleText } from "@/lib/extract";
import type { Locale } from "@/lib/i18n/locale";

// the system prompt is sent once per batch, so bigger batches are cheaper —
// but with 20 the model sometimes stopped early (5 of 20 results) or mixed
// up summaries; 10 is the compromise
const BATCH_SIZE = 10;
// articles the model skipped or mixed up get one more try in tiny batches
const RETRY_BATCH_SIZE = 3;
const DEEP_BATCH_SIZE = 5;
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
// everything fresh (48h window) gets classified on each run; this is only a
// cost/latency safety cap, normally a run has far fewer new articles
const MAX_PER_RUN = 400;
// batches run in parallel so a full run doesn't take minutes
const CONCURRENCY = 4;

// articles that look promising enough after the first pass (title only)
// to be worth fetching in full and re-classifying more thoroughly
const DEEPEN_PRIORITY_THRESHOLD = 3;
const MAX_DEEPEN_PER_RUN = 25;
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

Dla każdego newsa ustal (każdy obiekt w odpowiedzi dotyczy WYŁĄCZNIE newsa o podanym id — nie mieszaj treści między newsami):
- titleEcho: pierwsze 5-6 słów tytułu TEGO newsa, przepisane dosłownie, bez tłumaczenia (służy do weryfikacji, że opis dotyczy właściwego newsa).
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
  titleEcho: string;
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
                  // order matters: the model writes fields in this order, so
                  // echoing the title right before the summary anchors the
                  // summary to the right article
                  id: { type: "string" },
                  titleEcho: { type: "string" },
                  summary: { type: "string" },
                  category: { type: "string", enum: CATEGORIES },
                  priority: { type: "integer", minimum: 1, maximum: 5 },
                  quality: { type: ["string", "null"], enum: [...QUALITY_LABELS, null] },
                  qualityNote: { type: ["string", "null"] },
                  sponsored: { type: "boolean" },
                  language: { type: "string", enum: LANGUAGES },
                },
                required: [
                  "id",
                  "titleEcho",
                  "summary",
                  "category",
                  "priority",
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

// pairs results with their articles. Articles whose title echo doesn't
// match, or that the model left out entirely, come back as `rejected`.
function verifyResults(
  batch: PendingArticle[],
  results: ClassificationResult[],
): { accepted: { article: PendingArticle; result: ClassificationResult }[]; rejected: PendingArticle[] } {
  const accepted: { article: PendingArticle; result: ClassificationResult }[] = [];
  const rejected: PendingArticle[] = [];
  const seen = new Set<string>();

  for (const result of results) {
    const article = batch.find((a) => a.id === result.id);
    if (!article || seen.has(article.id)) continue;
    seen.add(article.id);
    if (titleEchoMatches(result.titleEcho, article.title)) {
      accepted.push({ article, result });
    } else {
      rejected.push(article);
    }
  }

  const answered = new Set(accepted.map((a) => a.article.id));
  for (const article of batch) {
    if (!answered.has(article.id) && !rejected.includes(article)) rejected.push(article);
  }

  return { accepted, rejected };
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      out[index] = await fn(items[index]);
    }
  });
  await Promise.all(workers);
  return out;
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
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
  const groups = await mapWithConcurrency(
    chunk(ordered, DEEP_BATCH_SIZE),
    CONCURRENCY,
    async (group) => {
      const withText = await Promise.all(
        group.map(async (candidate): Promise<PendingArticle | null> => {
          const fullText = await extractArticleText(candidate.url);
          return fullText ? { ...candidate, content: fullText } : null;
        }),
      );
      const readable = withText.filter((c): c is PendingArticle => c !== null);
      if (readable.length === 0) return null;
      const { results, usage: batchUsage } = await classifyBatch(
        client,
        readable,
        DEEP_EXCERPT_CHARS,
        systemPrompt,
      );
      return { readable, results, batchUsage };
    },
  );

  for (const group of groups) {
    if (!group) continue;
    usage = addUsage(usage, group.batchUsage);

    // a mismatched deep result is simply dropped — the article keeps its
    // (verified) shallow classification
    const { accepted } = verifyResults(group.readable, group.results);
    for (const { article, result } of accepted) {
      const priority = applyQualityClamp(clampPriority(result.priority), result.quality);

      await prisma.article.update({
        where: { id: article.id },
        data: {
          category: toCategory(result.category),
          priority,
          worthReading: priority >= 4,
          summary: result.summary,
          content: article.content,
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

export async function classifyPendingArticles(
  locale: Locale = "pl",
  maxArticles: number = MAX_PER_RUN,
) {
  const client = getClient();
  const systemPrompt =
    BASE_SYSTEM_PROMPT + (await buildFeedbackContext()) + languageDirective(locale);

  // older than the window and still unclassified → skipped for good, so a
  // long break never turns into a backlog of stale news
  const skippedStale = await skipStaleUnclassified();

  // newest first, in case the safety cap cuts the run short
  const pending = await prisma.article.findMany({
    where: await pendingClassificationFilter(),
    orderBy: { publishedAt: "desc" },
    take: maxArticles,
    select: { id: true, title: true, sourceName: true, content: true, url: true },
  });

  let classified = 0;
  let usage: TokenUsage = { promptTokens: 0, completionTokens: 0 };
  const deepenCandidates: { article: PendingArticle; priority: number }[] = [];

  async function save(article: PendingArticle, result: ClassificationResult) {
    const hasRichContent = (article.content?.length ?? 0) > RICH_CONTENT_THRESHOLD;
    // when real content is already present up front (HN self-posts), the
    // model rates quality right away — with just a title, the prompt tells
    // it to return null
    const priority = applyQualityClamp(clampPriority(result.priority), result.quality);

    await prisma.article.update({
      where: { id: article.id },
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
      deepenCandidates.push({ article, priority });
    }
  }

  async function runBatches(articles: PendingArticle[], size: number): Promise<PendingArticle[]> {
    const outcomes = await mapWithConcurrency(chunk(articles, size), CONCURRENCY, async (batch) => {
      const { results, usage: batchUsage } = await classifyBatch(
        client,
        batch,
        SHALLOW_EXCERPT_CHARS,
        systemPrompt,
      );
      return { batch, results, batchUsage };
    });

    const rejected: PendingArticle[] = [];
    for (const { batch, results, batchUsage } of outcomes) {
      usage = addUsage(usage, batchUsage);
      const verified = verifyResults(batch, results);
      for (const { article, result } of verified.accepted) await save(article, result);
      rejected.push(...verified.rejected);
    }
    return rejected;
  }

  const rejected = await runBatches(pending, BATCH_SIZE);
  // one retry in tiny batches; anything still failing stays pending for
  // the next run
  const stillRejected =
    rejected.length > 0 ? await runBatches(rejected, RETRY_BATCH_SIZE) : [];

  const deepenResult = await deepenArticles(client, deepenCandidates, systemPrompt);
  usage = addUsage(usage, deepenResult.usage);

  return {
    classified,
    deepened: deepenResult.deepened,
    pending: pending.length,
    skippedStale,
    retried: rejected.length,
    stillPending: stillRejected.length,
    tokensUsed: usage,
  };
}
