import { Skeleton } from "@/components/ui/skeleton";

export function PageLoader() {
  return (
    <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Loading page">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-11 w-full max-w-xs" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
    </div>
  );
}
