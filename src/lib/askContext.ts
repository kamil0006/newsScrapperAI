// ile dni wstecz czat bierze pod uwagę przy odpowiadaniu na pytania
export const ASK_LOOKBACK_DAYS = 14;

export function getAskSince(): Date {
  return new Date(Date.now() - ASK_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
}
