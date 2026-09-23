// szybki, tani filtr łapiący oczywiste kupony/kody rabatowe zanim w ogóle
// trafią do bazy — subtelniejsze przypadki (natywna reklama itp.) łapie AI
// przy klasyfikacji (pole `sponsored`)
const PROMO_PATTERNS = [
  /\bpromo\s?codes?\b/i,
  /\bcoupons?\b/i,
  /\bdiscount\s?codes?\b/i,
  /\bdeal of the day\b/i,
];

export function isObviousPromo(title: string): boolean {
  return PROMO_PATTERNS.some((pattern) => pattern.test(title));
}
