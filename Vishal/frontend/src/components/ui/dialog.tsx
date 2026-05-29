import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        aria-label="Close dialog"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-10 w-full sm:max-w-lg">{children}</div>
    </div>
  );
}

export function DialogContent({
  className,
  children,
  onClose,
}: {
  className?: string;
  children: React.ReactNode;
  onClose?: () => void;
}) {
  return (
    <div
      className={cn(
        "glass-panel animate-fade-in max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl rounded-b-none border border-white/60 px-4 py-5 pb-safe shadow-[var(--shadow-3d-lg)] sm:max-w-lg sm:rounded-2xl sm:p-6",
        className
      )}
      role="dialog"
      aria-modal="true"
    >
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      {children}
    </div>
  );
}

export function DialogHeader({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 pr-8", className)}>{children}</div>;
}

export function DialogTitle({ className, children }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn("text-lg font-semibold text-slate-900", className)}>
      {children}
    </h2>
  );
}

export function DialogFooter({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mt-6 flex flex-col gap-2 pb-safe sm:flex-row sm:pb-0", className)}>
      {children}
    </div>
  );
}
