import { describe, expect, it } from "vitest";
import { isObviousPromo } from "@/lib/sources/promoFilter";

describe("isObviousPromo", () => {
  it("catches real coupons/promo found in real feeds", () => {
    const known = [
      "Loop Earplugs Discount Codes: 40% Off",
      "Ruggable Discount Code: 30% Off Rugs",
      "SelectBlinds Promo Codes & Coupons: 10% Off",
      "Logitech Promo Codes and Deals: Up to $100 Off",
      "Western Digital Promo Code: 15% Off",
      "T-Mobile Promo Codes: 25% Off | September 2026",
      "Acer Promo Codes: 40% Off",
      "Womanizer Coupons: Save 15% in September 2026",
    ];
    known.forEach((title) => expect(isObviousPromo(title)).toBe(true));
  });

  it("doesn't catch real news mentioning percentages (regression: '% off')", () => {
    // this exact false positive was caught and fixed — the "% off" pattern
    // also matched real market/industry news, not just coupons
    expect(isObviousPromo("Apple stock drops 5% off record highs amid chip shortage")).toBe(
      false,
    );
    expect(isObviousPromo("Bungie un-cancels Destiny: Vaulted content is coming back")).toBe(
      false,
    );
    expect(isObviousPromo("Xbox Game Pass adds 10 new titles this month")).toBe(false);
  });
});
