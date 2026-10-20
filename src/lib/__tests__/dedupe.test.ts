import { describe, expect, it } from "vitest";
import { isDuplicateMatch, type Candidate } from "@/lib/dedupe";
import { textWords } from "@/lib/textSimilarity";

function makeCandidate(overrides: Partial<Candidate> & { title: string }): Candidate {
  return {
    id: "id",
    category: "Gaming",
    sourceName: "Source A",
    summaryWords: new Set(),
    ...overrides,
    titleWords: textWords(overrides.title),
  };
}

describe("isDuplicateMatch", () => {
  it("doesn't merge articles from the same source (regression: sourceType vs sourceName)", () => {
    // this is exactly the bug that actually occurred: two different RSS
    // feeds (different sourceName) must be able to match, but the same
    // sourceName (two articles from the same outlet) should never match
    const a = makeCandidate({
      title: "Silent Hill: Townfall review",
      sourceName: "PC Gamer",
    });
    const b = makeCandidate({
      title: "Silent Hill: Townfall review",
      sourceName: "PC Gamer",
    });

    expect(isDuplicateMatch(a, b)).toBe(false);
  });

  it("merges the same story from two different outlets (even with the same sourceType)", () => {
    const a = makeCandidate({
      title: "Silent Hill: Townfall review - an often inspired trek into the fog",
      sourceName: "Rock Paper Shotgun",
    });
    const b = makeCandidate({
      title: "Silent Hill: Townfall Review",
      sourceName: "PC Gamer",
    });

    expect(isDuplicateMatch(a, b)).toBe(true);
  });

  it("doesn't merge different categories, even with identical titles", () => {
    const a = makeCandidate({
      title: "Big announcement today",
      sourceName: "Outlet A",
      category: "Gaming",
    });
    const b = makeCandidate({
      title: "Big announcement today",
      sourceName: "Outlet B",
      category: "Tech",
    });

    expect(isDuplicateMatch(a, b)).toBe(false);
  });

  it("merges via a matching summary despite completely different titles", () => {
    const a = makeCandidate({
      title: "OpenAI ships new reasoning model",
      sourceName: "Hacker News",
      summaryWords: textWords(
        "OpenAI wydało nowy model rozumowania, który znacząco poprawia wyniki w testach matematycznych",
      ),
    });
    const b = makeCandidate({
      title: "Big news from a major AI lab today",
      sourceName: "The Verge",
      summaryWords: textWords(
        "Nowy model rozumowania od OpenAI osiąga znacznie lepsze wyniki w testach matematycznych",
      ),
    });

    expect(isDuplicateMatch(a, b)).toBe(true);
  });

  it("doesn't merge unrelated news despite shared generic words", () => {
    const a = makeCandidate({
      title: "Apple stock drops 5% amid market volatility",
      sourceName: "Outlet A",
    });
    const b = makeCandidate({
      title: "Xbox Game Pass adds 10 new titles this month",
      sourceName: "Outlet B",
    });

    expect(isDuplicateMatch(a, b)).toBe(false);
  });
});
