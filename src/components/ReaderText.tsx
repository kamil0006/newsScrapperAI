import { dictionaries } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/locale";
import { getReaderBlocks } from "@/lib/reader";

export async function ReaderText({
  articleId,
  url,
  locale,
}: {
  articleId: string;
  url: string;
  locale: Locale;
}) {
  const dict = dictionaries[locale].reader;
  const blocks = await getReaderBlocks(articleId);

  if (!blocks) {
    return (
      <div className="rounded-lg border border-dashed border-border p-5 text-sm">
        <p className="text-text">{dict.unavailable}</p>
        <p className="text-text-muted mt-1">{dict.unavailableHint}</p>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-block mt-3 text-sm font-medium hover:underline"
          style={{ color: "var(--signal)" }}
        >
          {dict.openOriginal} ↗
        </a>
      </div>
    );
  }

  return (
    <div className="font-serif text-[1.075rem] leading-[1.75] text-text space-y-5">
      {blocks.map((block, i) => {
        switch (block.t) {
          case "h":
            return (
              <h2 key={i} className="font-sans text-lg font-semibold pt-3 text-text">
                {block.x}
              </h2>
            );
          case "q":
            return (
              <blockquote key={i} className="border-l-2 border-border pl-4 italic text-text-muted">
                {block.x}
              </blockquote>
            );
          case "li":
            return (
              <p key={i} className="pl-5 relative">
                <span aria-hidden className="absolute left-1 text-text-faint">•</span>
                {block.x}
              </p>
            );
          default:
            return <p key={i}>{block.x}</p>;
        }
      })}
    </div>
  );
}
