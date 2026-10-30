import { Skeleton } from "@/components/Skeleton";
import { SidebarSkeleton } from "@/components/SidebarSkeleton";

export default function Loading() {
  return (
    <>
      <SidebarSkeleton />

      <div className="flex-1 min-w-0 flex flex-col">
        <main className="flex-1 min-w-0 px-4 sm:px-6 py-6 max-w-xl">
          <div className="mb-6 space-y-2">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>

          <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
            <Skeleton className="h-4 w-64" />
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-3 py-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-9 rounded-full" />
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-border bg-surface p-4 mt-4 flex items-center justify-between gap-3">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
            <Skeleton className="h-8 w-28 shrink-0" />
          </div>
        </main>
      </div>
    </>
  );
}
