"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/auth/currentUser";
import { prisma } from "@/lib/prisma";

export async function completeOnboarding() {
  const userId = await getCurrentUserId();
  if (!userId) return;

  await prisma.user.update({
    where: { id: userId },
    data: { onboardingCompletedAt: new Date() },
  });
}

export async function resetOnboarding() {
  const userId = await getCurrentUserId();
  if (!userId) return;

  await prisma.user.update({
    where: { id: userId },
    data: { onboardingCompletedAt: null },
  });
  revalidatePath("/");
}
