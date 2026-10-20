import { dictionaries } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/locale";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export const CATCHUP_THRESHOLD_HOURS = 18;
const MAX_CATCHUP_DAYS = 30;

export type CatchUpState = {
  isCatchUp: boolean;
  since: Date | null;
  hoursAway: number;
};

export async function getCatchUpState(userId: string): Promise<CatchUpState> {
  const state = await prisma.visitState.findUnique({ where: { userId } });
  if (!state) return { isCatchUp: false, since: null, hoursAway: 0 };

  const now = Date.now();
  const hoursAway = (now - state.lastVisitedAt.getTime()) / (1000 * 60 * 60);

  if (hoursAway < CATCHUP_THRESHOLD_HOURS) {
    return { isCatchUp: false, since: null, hoursAway };
  }

  const earliestAllowed = now - MAX_CATCHUP_DAYS * 24 * 60 * 60 * 1000;
  const since = new Date(Math.max(state.lastVisitedAt.getTime(), earliestAllowed));

  return { isCatchUp: true, since, hoursAway };
}

export function catchUpDateFilter(since: Date): Prisma.ArticleWhereInput {
  return {
    OR: [
      { publishedAt: { gte: since } },
      { publishedAt: null, fetchedAt: { gte: since } },
    ],
  };
}

export function sinceLabel(hours: number, locale: Locale = "pl"): string {
  const t = dictionaries[locale].time;
  if (hours < 24) {
    const h = Math.max(1, Math.round(hours));
    return h === 1 ? t.sinceHour : t.sinceHours(h);
  }
  const days = Math.max(1, Math.round(hours / 24));
  return days === 1 ? t.sinceDay : t.sinceDays(days);
}
