import { cn } from "@/lib/utils";

interface StickyFormActionsProps {
  children: React.ReactNode;
  className?: string;
}

/** Sticks Save/Cancel above the mobile bottom nav; static on md+ */
export function StickyFormActions({ children, className }: StickyFormActionsProps) {
  return (
    <div
      className={cn(
        "sticky z-30 -mx-4 flex flex-col gap-2 border-t border-[var(--color-border)] bg-[var(--color-card)]/95 p-4 backdrop-blur-md",
        "bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))]",
        "sm:static sm:mx-0 sm:flex-row sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none",
        className
      )}
    >
      {children}
    </div>
  );
}
