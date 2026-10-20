import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { languageDirective } from "@/lib/ai/languageDirective";
import { getAskSince } from "@/lib/askContext";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";
import { parseHiddenCategories, visibleCategoriesFilter } from "@/lib/categoryPrefs";
import { visibleContentFilter } from "@/lib/contentFilter";
import { dictionaries } from "@/lib/i18n/dictionary";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE_NAME } from "@/lib/i18n/locale";
import { prisma } from "@/lib/prisma";

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
// fewer candidates = fewer chances for the model to mix up which article
// a given point refers to — this was noticeably happening at 150 items
const MAX_CONTEXT_ARTICLES = 40;
const MAX_HISTORY_MESSAGES = 6;
const MAX_QUESTION_LENGTH = 500;
// full text for the article the user explicitly picked to discuss, so the
// model has more than just the shallow summary to work with
const FOCUS_EXCERPT_CHARS = 3000;

type ChatMessage = { role: "user" | "assistant"; content: string };

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (v.role === "user" || v.role === "assistant") && typeof v.content === "string";
}

const ASK_SYSTEM_PROMPT =
  "Odpowiadasz na pytania o newsy z bazy użytkownika (AI, technologia, gry). Masz dostęp WYŁĄCZNIE do listy newsów podanej w wiadomości użytkownika jako JSON — nie zmyślaj faktów spoza niej.\n\nOdpowiedź buduj z osobnych punktów (points) — każdy punkt to jedno konkretne, zwięzłe zdanie oparte na DOKŁADNIE JEDNYM newsie z listy. W polu index podaj numer (index) TEGO newsa z listy — uważnie sprawdź, że numer faktycznie odpowiada newsowi, o którym piszesz w text, nie innemu. Nie pisz punktu bez pokrycia w konkretnym newsie. Jeśli pytanie dotyczy kilku newsów, dodaj kilka punktów; jeśli jednego, dodaj jeden.\n\nintro to krótkie (0-1 zdanie) wprowadzenie — albo cała odpowiedź, jeśli baza nie zawiera niczego pasującego (wtedy powiedz to wprost, a points zostaw puste).\n\nNie numeruj punktów ani nie dodawaj nawiasów kwadratowych — to robi system, nie Ty.";

export async function POST(req: NextRequest) {
  const cookieLocale = req.cookies.get(LOCALE_COOKIE_NAME)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;
  const dict = dictionaries[locale];

  const userId = await verifySessionToken(req.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!userId) {
    return NextResponse.json({ error: dict.errors.invalidRequest }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: dict.errors.missingApiKey }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: dict.errors.invalidRequest }, { status: 400 });
  }

  const record = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const question =
    typeof record.question === "string" ? record.question.trim().slice(0, MAX_QUESTION_LENGTH) : "";
  const history: ChatMessage[] = Array.isArray(record.history)
    ? record.history.filter(isChatMessage).slice(-MAX_HISTORY_MESSAGES)
    : [];
  const articleId = typeof record.articleId === "string" ? record.articleId : null;

  if (!question) {
    return NextResponse.json({ error: dict.errors.emptyQuestion }, { status: 400 });
  }

  try {
    const since = getAskSince();
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { hiddenCategories: true } });
    const hiddenCategories = parseHiddenCategories(user?.hiddenCategories ?? "");

    // fetched regardless of freshness/priority filters — the user explicitly
    // picked this one from the article list, so it must always be discussable
    const [focusArticle, generalArticles] = await Promise.all([
      articleId
        ? prisma.article.findUnique({
            where: { id: articleId },
            select: {
              id: true,
              title: true,
              url: true,
              category: true,
              priority: true,
              summary: true,
              sourceName: true,
              publishedAt: true,
              content: true,
            },
          })
        : Promise.resolve(null),
      prisma.article.findMany({
        where: {
          AND: [
            { classifiedAt: { not: null }, duplicateOfId: null },
            { NOT: { articleStates: { some: { userId, dismissed: true } } } },
            visibleContentFilter(),
            visibleCategoriesFilter(hiddenCategories),
            { OR: [{ publishedAt: { gte: since } }, { fetchedAt: { gte: since } }] },
          ],
        },
        orderBy: [{ priority: "desc" }, { publishedAt: "desc" }],
        take: MAX_CONTEXT_ARTICLES,
        select: {
          id: true,
          title: true,
          url: true,
          category: true,
          priority: true,
          summary: true,
          sourceName: true,
          publishedAt: true,
        },
      }),
    ]);

    const rest = generalArticles
      .filter((a) => a.id !== focusArticle?.id)
      .slice(0, focusArticle ? MAX_CONTEXT_ARTICLES - 1 : MAX_CONTEXT_ARTICLES);
    const articles = focusArticle ? [focusArticle, ...rest] : rest;

    if (articles.length === 0) {
      return NextResponse.json({
        answer:
          locale === "en"
            ? "The database is still empty or nothing is classified yet — fetch and classify news first."
            : "Baza jest jeszcze pusta albo nic nie jest sklasyfikowane — najpierw pobierz i sklasyfikuj newsy.",
        sources: [],
      });
    }

    const client = new OpenAI({ apiKey });

    // the model cites a simple list number instead of a long id — it's
    // easier for it to get right than to faithfully transcribe a random string
    const context = articles.map((a, i) => ({
      index: i + 1,
      title: a.title,
      category: a.category,
      priority: a.priority,
      source: a.sourceName,
      date: a.publishedAt?.toISOString().slice(0, 10) ?? null,
      summary: a.summary,
      excerpt:
        i === 0 && focusArticle?.content ? focusArticle.content.slice(0, FOCUS_EXCERPT_CHARS) : undefined,
    }));

    const focusNote = focusArticle
      ? "Rozmowa skupia się na newsie #1 poniżej (ma dodatkowe pole \"excerpt\" z pełniejszą treścią). Pozostałe newsy to dodatkowy kontekst z bazy, przydatny do porównań czy powiązanych wątków.\n\n"
      : "";

    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: ASK_SYSTEM_PROMPT + languageDirective(locale) },
        ...history,
        {
          role: "user",
          content: `${focusNote}Newsy w bazie (JSON):\n${JSON.stringify(context)}\n\nPytanie: ${question}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "ask_answer",
          strict: true,
          schema: {
            type: "object",
            properties: {
              intro: { type: "string" },
              points: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    text: { type: "string" },
                    index: { type: "integer" },
                  },
                  required: ["text", "index"],
                  additionalProperties: false,
                },
              },
            },
            required: ["intro", "points"],
            additionalProperties: false,
          },
        },
      },
    });

    const raw = response.choices[0]?.message.content ?? "{}";
    const parsed = JSON.parse(raw) as {
      intro: string;
      points: { text: string; index: number }[];
    };

    // numbering and [N] markers are built HERE, from the same `points`
    // array we build the sources list from — the model doesn't have to
    // maintain two separate, potentially drifting representations
    const bodyLines = parsed.points.map((point, i) =>
      parsed.points.length > 1
        ? `${i + 1}. ${point.text} [${i + 1}]`
        : `${point.text} [1]`,
    );
    const answer = [parsed.intro, ...bodyLines]
      .map((line) => line?.trim())
      .filter(Boolean)
      .join("\n\n");

    const sources: { id: string; title: string; url: string }[] = [];
    const seenIndexes = new Set<number>();
    for (const point of parsed.points) {
      const article = articles[point.index - 1];
      if (!article || seenIndexes.has(point.index)) continue;
      seenIndexes.add(point.index);
      sources.push({ id: article.id, title: article.title, url: article.url });
    }

    return NextResponse.json({ answer, sources });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: dict.errors.askFailed(message) }, { status: 502 });
  }
}
