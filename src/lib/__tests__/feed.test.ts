import { describe, expect, it } from "vitest";
import { feedQuery, parseFeedFilters, pickNext, pickUpcoming } from "@/lib/feed";

const art = (id: string) => ({ id });
// candidates arrive already in feed order (priority high→low, then newest)
const feed = [art("p5"), art("p4"), art("p3a"), art("p3b"), art("p1")];

describe("pickNext / pickUpcoming", () => {
  it("always suggests the most important unread, even after opening a low-priority one", () => {
    expect(pickNext(art("p3b"), feed)?.id).toBe("p5");
    expect(pickUpcoming(art("p3b"), feed, 3).map((a) => a.id)).toEqual(["p5", "p4", "p3a"]);
  });

  it("skips the article that's currently open", () => {
    expect(pickNext(art("p5"), feed)?.id).toBe("p4");
  });

  it("returns nothing when only the open article is left", () => {
    expect(pickNext(art("p5"), [art("p5")])).toBeNull();
    expect(pickUpcoming(art("p5"), [], 4)).toEqual([]);
  });
});

describe("feed filters", () => {
  it("round-trips through the query string and drops unknown categories", () => {
    const filters = parseFeedFilters({ category: "AI", source: "Hacker News", q: " rust " });
    expect(filters).toEqual({ category: "AI", source: "Hacker News", q: "rust" });
    expect(parseFeedFilters(Object.fromEntries(new URLSearchParams(feedQuery(filters))))).toEqual(filters);
    expect(parseFeedFilters({ category: "Nope" }).category).toBeNull();
  });
});
