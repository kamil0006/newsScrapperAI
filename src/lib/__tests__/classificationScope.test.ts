import { describe, expect, it } from "vitest";
import { hiddenByEveryone } from "@/lib/categoryPrefs";
import { sourceNamesForCategories } from "@/lib/sources/rss";

describe("hiddenByEveryone", () => {
  it("returns nothing when there are no accounts", () => {
    expect(hiddenByEveryone([])).toEqual([]);
  });

  it("returns a single account's hidden categories", () => {
    expect(hiddenByEveryone([["Business", "Science"]])).toEqual(["Business", "Science"]);
  });

  it("keeps only categories hidden by every account", () => {
    expect(
      hiddenByEveryone([
        ["Business", "Science", "Entertainment"],
        ["Science", "Entertainment"],
        ["Entertainment", "Gaming"],
      ]),
    ).toEqual(["Entertainment"]);
  });

  it("returns nothing if any account hides nothing", () => {
    expect(hiddenByEveryone([["Business"], []])).toEqual([]);
  });
});

describe("sourceNamesForCategories", () => {
  it("maps single-topic feeds to their category", () => {
    const names = sourceNamesForCategories(["Entertainment"]);
    expect(names).toContain("Variety");
    expect(names).not.toContain("Ars Technica");
  });

  it("never skips mixed feeds", () => {
    const all = sourceNamesForCategories([
      "AI", "Gaming", "Tech", "Business", "Science", "Entertainment", "Inne",
    ]);
    for (const mixed of ["Ars Technica", "TechCrunch", "Wired", "Lobsters", "Dev.to", "MIT Technology Review"]) {
      expect(all).not.toContain(mixed);
    }
  });
});
