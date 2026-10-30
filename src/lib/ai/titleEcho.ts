// Guard against the model mixing up articles inside one batch (it once gave
// one game's summary to another). The model has to copy the start of the
// title right before writing the summary; if that copy doesn't match the
// title of the article with the returned id, the result is thrown away.

const MIN_OVERLAP = 0.6;

function words(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

export function titleEchoMatches(echo: string | null | undefined, title: string): boolean {
  if (!echo) return false;
  const echoWords = words(echo);
  if (echoWords.length === 0) return false;
  const titleWords = new Set(words(title));
  const hits = echoWords.filter((w) => titleWords.has(w)).length;
  return hits / echoWords.length >= MIN_OVERLAP;
}
