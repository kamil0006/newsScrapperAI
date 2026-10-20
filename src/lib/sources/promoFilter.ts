// a fast, cheap filter that catches obvious coupons/discount codes before
// they even reach the database — subtler cases (native ads etc.) are
// caught by AI during classification (the `sponsored` field)
const PROMO_PATTERNS = [
  /\bpromo\s?codes?\b/i,
  /\bcoupons?\b/i,
  /\bdiscount\s?codes?\b/i,
  /\bdeal of the day\b/i,
];

export function isObviousPromo(title: string): boolean {
  return PROMO_PATTERNS.some((pattern) => pattern.test(title));
}
