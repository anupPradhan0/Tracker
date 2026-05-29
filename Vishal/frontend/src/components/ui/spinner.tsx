import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-8 w-8 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600",
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );
}

export function PageLoader() {
  return (
    <div className="bg-mesh flex min-h-screen items-center justify-center">
      <Spinner className="h-10 w-10" />
    </div>
  );
}
