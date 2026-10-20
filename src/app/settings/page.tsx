import { redirect } from "next/navigation";
import { CategoryVisibilityList } from "@/components/CategoryVisibilityList";
import { Sidebar } from "@/components/Sidebar";
import { getCurrentUserId } from "@/lib/auth/currentUser";
import { parseHiddenCategories } from "@/lib/categoryPrefs";
import { dictionaries } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/locale";
import { getNavCounts } from "@/lib/navCounts";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const locale = await getLocale();
  const dict = dictionaries[locale];

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { hiddenCategories: true } });
  const hiddenCategories = parseHiddenCategories(user?.hiddenCategories ?? "");
  const counts = await getNavCounts(userId, hiddenCategories);

  return (
    <>
      <Sidebar active="settings" counts={counts} locale={locale} />

      <div className="flex-1 flex flex-col">
        <main className="flex-1 min-w-0 px-4 sm:px-6 py-6 max-w-xl">
          <div className="mb-6">
            <h1 className="font-serif text-2xl text-text">{dict.settings.title}</h1>
            <p className="text-sm text-text-muted mt-1">{dict.settings.subtitle}</p>
          </div>

          <CategoryVisibilityList hiddenCategories={hiddenCategories} locale={locale} />
        </main>
      </div>
    </>
  );
}
