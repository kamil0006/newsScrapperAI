import { KeyPointsSkeleton, ReaderTextSkeleton } from "@/components/ReaderBodySkeleton";
import { Skeleton } from "@/components/Skeleton";
import { SidebarSkeleton } from "@/components/SidebarSkeleton";

export default function Loading() {
  return (
    <>
      <SidebarSkeleton />

      <div className="flex-1 min-w-0 flex flex-col xl:flex-row xl:gap-8">
        <main className="min-w-0 px-4 sm:px-6 py-6 w-full max-w-2xl">
          <Skeleton className="h-4 w-16" />
          <div className="mt-5 mb-7 space-y-3">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-3/4" />
          </div>
          <KeyPointsSkeleton />
          <ReaderTextSkeleton />
        </main>

        <aside className="hidden xl:block w-72 shrink-0 py-6 pr-6">
          <Skeleton className="h-44 w-full rounded-lg" />
        </aside>
      </div>
    </>
  );
}
