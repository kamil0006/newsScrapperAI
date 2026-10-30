import { Skeleton } from "@/components/Skeleton";

export function SidebarSkeleton() {
  return (
    <aside className="w-full sm:w-56 shrink-0 border-b sm:border-b-0 sm:border-r border-border px-4 sm:px-5 py-3 sm:py-5 flex flex-col sm:gap-6 sm:sticky sm:top-0 sm:h-screen">
      <div className="flex items-center gap-2">
        <Skeleton className="w-6 h-6 rounded-md" />
        <Skeleton className="w-32 h-5" />
      </div>

      <div className="flex sm:flex-col gap-1 mt-3 sm:mt-0">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-20 sm:w-full shrink-0" />
        ))}
      </div>

      <div className="hidden sm:block">
        <Skeleton className="h-8 w-full" />
      </div>

      <div className="flex items-center gap-2 mt-3 sm:hidden">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-8 w-16" />
      </div>

      <div className="hidden sm:flex sm:flex-col sm:gap-3 sm:mt-auto sm:pt-3 sm:border-t sm:border-border">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-24" />
      </div>
    </aside>
  );
}
