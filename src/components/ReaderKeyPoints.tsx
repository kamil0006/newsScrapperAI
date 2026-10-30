import { dictionaries } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/locale";
import { getReaderBlocks, getReaderKeyPoints, readingMinutes } from "@/lib/reader";

export async function ReaderKeyPoints({
  articleId,
  summary,
  locale,
}: {
  articleId: string;
  summary: string | null;
  locale: Locale;
}) {
  const dict = dictionaries[locale].reader;
  const [keyPoints, blocks] = await Promise.all([
    getReaderKeyPoints(articleId, locale),
    getReaderBlocks(articleId),
  ]);
  // with no points and no summary there's nothing worth a box
  if (!keyPoints && !summary) return null;
  const minutes = blocks ? readingMinutes(blocks) : null;

  return (
    <section className="rounded-lg border border-border bg-surface p-4 sm:p-5 mb-8">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-faint">
          {dict.keyPoints}
        </h2>
        {minutes && <span className="text-xs text-text-faint">{dict.readingTime(minutes)}</span>}
      </div>
      {keyPoints ? (
        <>
          <ul className="space-y-2">
            {keyPoints.map((point, i) => (
              <li key={i} className="flex gap-3 text-sm leading-relaxed text-text">
                <span
                  aria-hidden
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: "var(--signal)" }}
                />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-text-faint">{dict.aiNote}</p>
        </>
      ) : (
        <p className="text-sm leading-relaxed text-text">{summary}</p>
      )}
    </section>
  );
}
