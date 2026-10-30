import { ArticleRowSkeleton } from "@/components/ArticleRowSkeleton";
import { Skeleton } from "@/components/Skeleton";
import { SidebarSkeleton } from "@/components/SidebarSkeleton";

export default function Loading() {
  return (
    <>
      <SidebarSkeleton />

      <div className="flex-1 min-w-0 flex flex-col">
        <main className="flex-1 min-w-0 px-4 sm:px-6 py-6 max-w-2xl">
          <Skeleton className="h-4 w-24" />

          <div className="mt-4 mb-6 space-y-2">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-72" />
          </div>

          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <ArticleRowSkeleton key={i} />
            ))}
          </div>
        </main>
      </div>
    </>
  );
}
