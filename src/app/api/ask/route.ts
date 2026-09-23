import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getAskSince } from "@/lib/askContext";
import { visibleContentFilter } from "@/lib/contentFilter";
import { prisma } from "@/lib/prisma";

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
// mniej kandydatów = mniej okazji, żeby model pomylił, którego newsa
// dotyczy dany punkt — przy 150 pozycjach zdarzało się to zauważalnie
const MAX_CONTEXT_ARTICLES = 40;
const MAX_HISTORY_MESSAGES = 6;
const MAX_QUESTION_LENGTH = 500;

type ChatMessage = { role: "user" | "assistant"; content: string };

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (v.role === "user" || v.role === "assistant") && typeof v.content === "string";
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Brak OPENAI_API_KEY w .env" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Nieprawidłowe zapytanie" }, { status: 400 });
  }

  const record = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
  const question =
    typeof record.question === "string" ? record.question.trim().slice(0, MAX_QUESTION_LENGTH) : "";
  const history: ChatMessage[] = Array.isArray(record.history)
    ? record.history.filter(isChatMessage).slice(-MAX_HISTORY_MESSAGES)
    : [];

  if (!question) {
    return NextResponse.json({ error: "Puste pytanie" }, { status: 400 });
  }

  try {
    const since = getAskSince();

    const articles = await prisma.article.findMany({
      where: {
        AND: [
          { classifiedAt: { not: null }, duplicateOfId: null, dismissed: false },
          visibleContentFilter(),
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
    });

    if (articles.length === 0) {
      return NextResponse.json({
        answer:
          "Baza jest jeszcze pusta albo nic nie jest sklasyfikowane — najpierw pobierz i sklasyfikuj newsy.",
        sources: [],
      });
    }

    const client = new OpenAI({ apiKey });

    // model cytuje prosty numer z listy zamiast długiego id — łatwiej mu
    // trafić poprawnie niż wiernie przepisać losowy ciąg znaków
    const context = articles.map((a, i) => ({
      index: i + 1,
      title: a.title,
      category: a.category,
      priority: a.priority,
      source: a.sourceName,
      date: a.publishedAt?.toISOString().slice(0, 10) ?? null,
      summary: a.summary,
    }));

    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "Odpowiadasz po polsku na pytania o newsy z bazy użytkownika (AI, technologia, gry). Masz dostęp WYŁĄCZNIE do listy newsów podanej w wiadomości użytkownika jako JSON — nie zmyślaj faktów spoza niej.\n\nOdpowiedź buduj z osobnych punktów (points) — każdy punkt to jedno konkretne, zwięzłe zdanie oparte na DOKŁADNIE JEDNYM newsie z listy. W polu index podaj numer (index) TEGO newsa z listy — uważnie sprawdź, że numer faktycznie odpowiada newsowi, o którym piszesz w text, nie innemu. Nie pisz punktu bez pokrycia w konkretnym newsie. Jeśli pytanie dotyczy kilku newsów, dodaj kilka punktów; jeśli jednego, dodaj jeden.\n\nintro to krótkie (0-1 zdanie) wprowadzenie — albo cała odpowiedź, jeśli baza nie zawiera niczego pasującego (wtedy powiedz to wprost, a points zostaw puste).\n\nNie numeruj punktów ani nie dodawaj nawiasów kwadratowych — to robi system, nie Ty.",
        },
        ...history,
        {
          role: "user",
          content: `Newsy w bazie (JSON):\n${JSON.stringify(context)}\n\nPytanie: ${question}`,
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

    // numerację i markery [N] budujemy TU, z tej samej tablicy `points`,
    // z której budujemy listę źródeł — model nie musi utrzymywać dwóch
    // osobnych, potencjalnie rozjeżdżających się reprezentacji
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
    const message = error instanceof Error ? error.message : "Nieznany błąd";
    return NextResponse.json({ error: `Nie udało się uzyskać odpowiedzi: ${message}` }, { status: 502 });
  }
}
