import { describe, expect, it } from "vitest";
import { jaccardSimilarity, textWords } from "@/lib/textSimilarity";

describe("textWords", () => {
  it("lowercases and strips punctuation", () => {
    const words = textWords("Silent Hill: Townfall Review!");
    expect(words.has("silent")).toBe(true);
    expect(words.has("hill")).toBe(true);
    expect(words.has("townfall")).toBe(true);
    expect(words.has("review")).toBe(true);
  });

  it("drops short and stop words", () => {
    const words = textWords("This is a review of the game");
    expect(words.has("this")).toBe(false); // stopword
    expect(words.has("is")).toBe(false); // stopword
    expect(words.has("a")).toBe(false); // too short
    expect(words.has("review")).toBe(true);
    expect(words.has("game")).toBe(true);
  });

  it("keeps Polish diacritics", () => {
    const words = textWords("Sztuczna inteligencja zmienia świat");
    expect(words.has("świat")).toBe(true);
    expect(words.has("inteligencja")).toBe(true);
  });
});

describe("jaccardSimilarity", () => {
  it("is 0 for disjoint sets", () => {
    const a = new Set(["silent", "hill"]);
    const b = new Set(["steam", "deck"]);
    expect(jaccardSimilarity(a, b)).toBe(0);
  });

  it("is 1 for identical sets", () => {
    const a = new Set(["silent", "hill", "townfall"]);
    expect(jaccardSimilarity(a, new Set(a))).toBe(1);
  });

  it("is 0 when either set is empty", () => {
    expect(jaccardSimilarity(new Set(), new Set(["a"]))).toBe(0);
    expect(jaccardSimilarity(new Set(["a"]), new Set())).toBe(0);
  });

  it("matches near-identical review titles from different outlets", () => {
    // a case we actually caught: the same reviews, different outlets
    const a = textWords(
      "Silent Hill: Townfall review - an often inspired, if slightly lumbering trek into the fog",
    );
    const b = textWords("Silent Hill: Townfall Review");
    expect(jaccardSimilarity(a, b)).toBeGreaterThanOrEqual(0.35);
  });
});
