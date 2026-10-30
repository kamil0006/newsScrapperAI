import { ArticleRowSkeleton } from "@/components/ArticleRowSkeleton";
import { Skeleton } from "@/components/Skeleton";
import { SidebarSkeleton } from "@/components/SidebarSkeleton";

export default function Loading() {
  return (
    <>
      <SidebarSkeleton />

      <div className="flex-1 min-w-0 flex flex-col lg:flex-row">
        <main className="flex-1 min-w-0 px-4 sm:px-6 py-6">
          <div className="mb-6 space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>

          <Skeleton className="h-32 w-full mb-5" />

          <div className="mb-5 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex gap-1 flex-wrap">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-16" />
              ))}
            </div>
            <Skeleton className="h-8 w-32" />
          </div>

          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ArticleRowSkeleton key={i} />
            ))}
          </div>
        </main>

        <aside className="w-full lg:w-72 shrink-0 px-4 sm:px-6 lg:pr-6 pb-6 lg:py-6">
          <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </aside>
      </div>
    </>
  );
}
