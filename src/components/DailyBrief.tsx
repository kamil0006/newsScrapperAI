import { Skeleton } from "@/components/Skeleton";
import { getOrCreateDailyBrief } from "@/lib/ai/brief";
import type { Category } from "@/lib/categories";
import { dictionaries } from "@/lib/i18n/dictionary";
import type { Locale } from "@/lib/i18n/locale";

function BriefFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mb-6 rounded-r-md border-l-2 bg-surface/60 pl-4 pr-4 py-3"
      style={{ borderColor: "var(--signal)" }}
    >
      {children}
    </div>
  );
}

export function DailyBrief({
  content,
  locale = "pl",
}: {
  content: string;
  locale?: Locale;
}) {
  return (
    <BriefFrame>
      <p className="text-xs text-text-faint mb-1.5">{dictionaries[locale].dailyBrief.heading}</p>
      <p className="text-sm text-text-muted leading-relaxed">{content}</p>
    </BriefFrame>
  );
}

// today's brief for this account's visible categories
export async function DailyBriefSection({
  hiddenCategories,
  locale,
}: {
  hiddenCategories: Category[];
  locale: Locale;
}) {
  let content: string | null = null;
  try {
    content = await getOrCreateDailyBrief(hiddenCategories, locale);
  } catch {
    // no brief is better than a broken homepage (e.g. OpenAI down)
    content = null;
  }
  return content ? <DailyBrief content={content} locale={locale} /> : null;
}

export function DailyBriefSkeleton() {
  return (
    <BriefFrame>
      <Skeleton className="h-3 w-24 mb-2.5" />
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-11/12" />
        <Skeleton className="h-3.5 w-3/4" />
      </div>
    </BriefFrame>
  );
}
