import { describe, expect, it } from "vitest";
import { toCategory } from "@/lib/categories";

describe("toCategory", () => {
  it("przepuszcza znane kategorie bez zmian", () => {
    expect(toCategory("AI")).toBe("AI");
    expect(toCategory("Gaming")).toBe("Gaming");
    expect(toCategory("Tech")).toBe("Tech");
  });

  it("maps unknown/empty values to 'Inne'", () => {
    expect(toCategory("Inne")).toBe("Inne");
    expect(toCategory("cokolwiek innego")).toBe("Inne");
    expect(toCategory(null)).toBe("Inne");
    expect(toCategory(undefined)).toBe("Inne");
    expect(toCategory("")).toBe("Inne");
  });
});
