"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ReadTrackingLink } from "@/components/ReadTrackingLink";

type Source = { id: string; title: string; url: string };
type Message = { role: "user" | "assistant"; content: string; sources?: Source[] };

export function ChatPanel({
  contextCount,
  suggestions,
}: {
  contextCount: number;
  suggestions: string[];
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function submitQuestion(question: string) {
    if (!question || pending) return;

    const nextMessages: Message[] = [...messages, { role: "user", content: question }];
    setMessages(nextMessages);
    setInput("");
    setPending(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessages([
          ...nextMessages,
          { role: "assistant", content: data.error ?? "Coś poszło nie tak." },
        ]);
        return;
      }

      setMessages([
        ...nextMessages,
        { role: "assistant", content: data.answer, sources: data.sources },
      ]);
    } catch {
      setMessages([
        ...nextMessages,
        { role: "assistant", content: "Nie udało się połączyć z serwerem." },
      ]);
    } finally {
      setPending(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submitQuestion(input.trim());
  }

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-6">
      <div className="flex-1 min-w-0">
        <div className="space-y-4 mb-6">
          {messages.length === 0 && (
            <p className="text-sm text-text-faint">
              Wybierz podpowiedź obok albo napisz własne pytanie — odpowiadam
              tylko na podstawie newsów z Twojej bazy.
            </p>
          )}

          {messages.map((message, i) => (
            <div key={i} className={message.role === "user" ? "text-right" : ""}>
              <div
                className={`inline-block max-w-[85%] sm:max-w-[70%] rounded-lg px-4 py-2.5 text-sm text-left ${
                  message.role === "user"
                    ? "bg-surface-raised text-text"
                    : "bg-surface text-text-muted border border-border"
                }`}
              >
                <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>

                {message.sources && message.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-border flex flex-col gap-1">
                    {message.sources.map((source) => (
                      <ReadTrackingLink
                        key={source.id}
                        articleId={source.id}
                        url={source.url}
                        className="text-xs text-text-faint hover:text-text underline underline-offset-2"
                      >
                        {source.title}
                      </ReadTrackingLink>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {pending && <p className="text-sm text-text-faint">Szukam w bazie…</p>}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Zapytaj o newsy…"
            className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-faint focus:outline-none focus:border-signal transition-colors"
          />
          <button
            type="submit"
            disabled={pending || !input.trim()}
            className="rounded-md border border-border px-4 py-2 text-sm text-text hover:bg-surface disabled:opacity-50 transition-colors"
          >
            Zapytaj
          </button>
        </form>
      </div>

      <aside className="w-full lg:w-72 shrink-0 space-y-4">
        <div className="rounded-lg border border-border bg-surface p-4">
          <h3 className="text-sm font-medium text-text mb-1">Zasięg</h3>
          <p className="text-sm text-text-muted leading-relaxed">
            Ostatnie 14 dni, {contextCount} newsów w bazie. Pytania o starsze
            albo spoza tematyki AI/tech/gier zostaną uczciwie odrzucone.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-4">
          <h3 className="text-sm font-medium text-text mb-3">Podpowiedzi</h3>
          <div className="flex flex-col gap-1">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => submitQuestion(suggestion)}
                disabled={pending}
                className="text-left text-sm text-text-muted hover:text-text hover:bg-surface-raised rounded-md px-2 py-1.5 transition-colors disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
