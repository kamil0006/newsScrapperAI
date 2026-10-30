import { Skeleton } from "@/components/Skeleton";
import { SidebarSkeleton } from "@/components/SidebarSkeleton";

export default function Loading() {
  return (
    <>
      <SidebarSkeleton />

      <div className="flex-1 min-w-0 flex flex-col">
        <main className="flex-1 min-w-0 px-4 sm:px-6 py-6 flex flex-col">
          <div className="mb-6 space-y-2">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-80" />
          </div>

          <div className="flex-1 flex flex-col lg:flex-row gap-6">
            <div className="flex-1 min-w-0 space-y-4">
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-10 w-1/2 ml-auto" />
              <Skeleton className="h-10 w-3/5" />
              <Skeleton className="h-10 w-full" />
            </div>

            <aside className="w-full lg:w-72 shrink-0 space-y-4">
              <div className="rounded-lg border border-border bg-surface p-4 space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-full" />
              </div>
              <div className="rounded-lg border border-border bg-surface p-4 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </aside>
          </div>
        </main>
      </div>
    </>
  );
}
