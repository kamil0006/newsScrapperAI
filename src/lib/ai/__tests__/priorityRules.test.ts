import { describe, expect, it } from "vitest";
import { applyQualityClamp, clampPriority } from "@/lib/ai/priorityRules";

describe("clampPriority", () => {
  it("keeps the value within 1-5", () => {
    expect(clampPriority(0)).toBe(1);
    expect(clampPriority(-3)).toBe(1);
    expect(clampPriority(6)).toBe(5);
    expect(clampPriority(100)).toBe(5);
  });

  it("rounds fractional values", () => {
    expect(clampPriority(3.4)).toBe(3);
    expect(clampPriority(3.6)).toBe(4);
  });
});

describe("applyQualityClamp", () => {
  it("clamps priority to max 2 for fluff, regardless of topic", () => {
    expect(applyQualityClamp(5, "lanie_wody")).toBe(2);
    expect(applyQualityClamp(3, "lanie_wody")).toBe(2);
  });

  it("doesn't change a priority already lower than 2", () => {
    expect(applyQualityClamp(1, "lanie_wody")).toBe(1);
  });

  it("doesn't touch priority for rzetelny/przeciętny/unrated", () => {
    expect(applyQualityClamp(5, "rzetelny")).toBe(5);
    expect(applyQualityClamp(4, "przeciętny")).toBe(4);
    expect(applyQualityClamp(5, null)).toBe(5);
  });
});
