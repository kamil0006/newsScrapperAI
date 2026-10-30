import { describe, expect, it } from "vitest";
import { briefKey, briefSystemPrompt, topicsList, visibleCategories } from "@/lib/ai/brief";

describe("daily brief per settings", () => {
  it("shares one brief between accounts with the same categories, in any order", () => {
    expect(briefKey("2026-10-30", "pl", ["Tech", "AI", "Gaming"])).toBe(
      briefKey("2026-10-30", "pl", ["Gaming", "Tech", "AI"]),
    );
  });

  it("keeps different languages and different categories apart", () => {
    const base = briefKey("2026-10-30", "pl", ["AI"]);
    expect(briefKey("2026-10-30", "en", ["AI"])).not.toBe(base);
    expect(briefKey("2026-10-30", "pl", ["AI", "Science"])).not.toBe(base);
    expect(briefKey("2026-10-31", "pl", ["AI"])).not.toBe(base);
  });

  it("names the reader's own topics in the prompt", () => {
    const categories = visibleCategories(["AI", "Gaming", "Tech", "Business", "Inne"]);
    expect(categories).toEqual(["Science", "Entertainment"]);
    const prompt = briefSystemPrompt(topicsList(categories, "pl"));
    expect(prompt).toContain("Nauka");
    expect(prompt).toContain("Rozrywka");
    expect(prompt).not.toMatch(/gry|technologi/i);
  });
});
