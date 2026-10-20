"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/auth/currentUser";
import type { Category } from "@/lib/categories";
import { parseHiddenCategories, serializeHiddenCategories } from "@/lib/categoryPrefs";
import { prisma } from "@/lib/prisma";

export async function setCategoryVisibility(category: Category, visible: boolean) {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { hiddenCategories: true } });
  const hidden = new Set(parseHiddenCategories(user?.hiddenCategories ?? ""));

  if (visible) hidden.delete(category);
  else hidden.add(category);

  await prisma.user.update({
    where: { id: userId },
    data: { hiddenCategories: serializeHiddenCategories([...hidden]) },
  });

  revalidatePath("/");
}
