import OpenAI from "openai";
import type { Locale } from "@/lib/i18n/locale";

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
// enough for the substance of a long article; keeps a single call cheap
const MAX_INPUT_CHARS = 9000;

const SYSTEM_PROMPT = `Dostajesz tytuł i treść artykułu. Wypisz 3-4 kluczowe punkty — to, co czytelnik powinien wynieść z tekstu, zanim zdecyduje, czy czytać całość.

Zasady:
- Każdy punkt to jedno konkretne zdanie: fakty, liczby, nazwy, konsekwencje. Bez ogólników typu "artykuł omawia…".
- Tylko to, co jest w treści — niczego nie dopisuj z własnej wiedzy.
- Nie powtarzaj tytułu.`;

// stronger than the shared languageDirective — with an English article as
// input, a plain "answer in Polish" was often ignored
function outputLanguage(locale: Locale): string {
  return locale === "en"
    ? "\n\nWrite every point in English, even if the article is in another language."
    : "\n\nKażdy punkt napisz PO POLSKU, nawet jeśli artykuł jest po angielsku — przetłumacz treść, nazwy własne zostaw w oryginale.";
}

export async function generateKeyPoints(
  title: string,
  text: string,
  locale: Locale,
): Promise<string[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const client = new OpenAI({ apiKey });
  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT + outputLanguage(locale) },
      {
        role: "user",
        content: JSON.stringify({ title, text: text.slice(0, MAX_INPUT_CHARS) }),
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "key_points",
        strict: true,
        schema: {
          type: "object",
          properties: { points: { type: "array", items: { type: "string" } } },
          required: ["points"],
          additionalProperties: false,
        },
      },
    },
  });

  const raw = response.choices[0]?.message.content ?? "{}";
  const points = (JSON.parse(raw) as { points?: unknown }).points;
  if (!Array.isArray(points)) return null;
  const clean = points.filter((p): p is string => typeof p === "string" && p.trim() !== "");
  return clean.length > 0 ? clean.slice(0, 4) : null;
}
