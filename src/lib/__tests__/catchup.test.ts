import { describe, expect, it } from "vitest";
import { catchUpDateFilter, sinceLabel } from "@/lib/catchup";

describe("sinceLabel", () => {
  it("uses singular genitive for 1 hour/day", () => {
    expect(sinceLabel(1)).toBe("od godziny");
    expect(sinceLabel(24)).toBe("od dnia");
  });

  it("odmienia godziny w liczbie mnogiej", () => {
    expect(sinceLabel(3)).toBe("od 3 godzin");
    expect(sinceLabel(18)).toBe("od 18 godzin");
  });

  it("przechodzi na dni po przekroczeniu 24h", () => {
    expect(sinceLabel(48)).toBe("od 2 dni");
    expect(sinceLabel(9 * 24)).toBe("od 9 dni");
  });

  it("never goes below 1 unit", () => {
    expect(sinceLabel(0.2)).toBe("od godziny");
  });
});

describe("catchUpDateFilter", () => {
  it("builds an OR condition covering publishedAt and missing publishedAt via fetchedAt", () => {
    const since = new Date("2026-09-01T00:00:00.000Z");
    const filter = catchUpDateFilter(since);

    expect(filter).toEqual({
      OR: [
        { publishedAt: { gte: since } },
        { publishedAt: null, fetchedAt: { gte: since } },
      ],
    });
  });
});
