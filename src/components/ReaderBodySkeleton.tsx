import { Skeleton } from "@/components/Skeleton";

export function KeyPointsSkeleton({ label }: { label?: string }) {
  return (
    <div aria-busy="true" className="rounded-lg border border-border bg-surface p-5 mb-8 space-y-3">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-4 w-4/5" />
      {label && <p className="sr-only">{label}</p>}
    </div>
  );
}

export function ReaderTextSkeleton() {
  return (
    <div aria-busy="true" className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className={`h-4 ${i % 4 === 3 ? "w-2/3" : "w-full"}`} />
      ))}
    </div>
  );
}
