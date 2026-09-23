import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export const CATCHUP_THRESHOLD_HOURS = 18;
const MAX_CATCHUP_DAYS = 30;

export type CatchUpState = {
  isCatchUp: boolean;
  since: Date | null;
  hoursAway: number;
};

export async function getCatchUpState(): Promise<CatchUpState> {
  const state = await prisma.visitState.findUnique({ where: { id: 1 } });
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

// "od" wymaga dopełniacza — stąd "godziny"/"dnia" w liczbie pojedynczej,
// a nie "godzinę"/"dzień" (to byłby biernik, inna konstrukcja)
export function sinceLabel(hours: number): string {
  if (hours < 24) {
    const h = Math.max(1, Math.round(hours));
    return h === 1 ? "od godziny" : `od ${h} godzin`;
  }
  const days = Math.max(1, Math.round(hours / 24));
  return days === 1 ? "od dnia" : `od ${days} dni`;
}
