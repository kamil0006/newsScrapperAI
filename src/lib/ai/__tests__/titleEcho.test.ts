import { describe, expect, it } from "vitest";
import { titleEchoMatches } from "@/lib/ai/titleEcho";

describe("titleEchoMatches", () => {
  const title = "Psychic Software announces The Lich Wars, a prequel to The Necromancer's Tale";

  it("accepts an exact copy of the title start", () => {
    expect(titleEchoMatches("Psychic Software announces The Lich", title)).toBe(true);
  });

  it("ignores case, punctuation and diacritics", () => {
    expect(titleEchoMatches("psychic software ANNOUNCES the lich wars,", title)).toBe(true);
    expect(titleEchoMatches("Zażółć gęślą jaźń", "Zazolc gesla jazn — test")).toBe(true);
  });

  it("rejects the echo of a different article from the same batch", () => {
    expect(titleEchoMatches("The Blood of Dawnwalker gets", title)).toBe(false);
  });

  it("rejects empty or missing echoes", () => {
    expect(titleEchoMatches("", title)).toBe(false);
    expect(titleEchoMatches(null, title)).toBe(false);
    expect(titleEchoMatches(" — ", title)).toBe(false);
  });
});
