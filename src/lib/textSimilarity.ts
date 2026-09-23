const STOPWORDS = new Set([
  "a", "an", "the", "of", "to", "in", "is", "for", "on", "with", "and",
  "how", "why", "what", "your", "you", "new", "this", "that", "from",
  "by", "at", "as", "are", "it", "its", "be", "will", "can", "i", "we",
  "jest", "się", "na", "do", "to", "co", "jak", "który", "która", "które",
  "oraz", "ale", "przez", "dla", "po", "od", "nie", "już", "może",
]);

export function textWords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9ąćęłńóśźż\s]/gi, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2 && !STOPWORDS.has(word)),
  );
}

export function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;

  let intersection = 0;
  for (const word of a) {
    if (b.has(word)) intersection += 1;
  }

  return intersection / (a.size + b.size - intersection);
}
