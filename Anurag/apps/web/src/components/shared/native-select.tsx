import * as React from "react";
import { cn } from "@/lib/utils";

export const NativeSelect = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
      className={cn(
        "box-border flex h-11 min-h-[44px] w-full max-w-full min-w-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 text-base text-[var(--color-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
    {...props}
  />
));
NativeSelect.displayName = "NativeSelect";
