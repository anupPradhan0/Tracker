import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  backTo?: string;
  backLabel?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  backTo,
  backLabel = "Back",
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("space-y-3", className)}>
      {backTo && (
        <Link
          to={backTo}
          className="inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)] -ml-1 px-1"
        >
          <ChevronLeft className="h-5 w-5 shrink-0" aria-hidden />
          {backLabel}
        </Link>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
