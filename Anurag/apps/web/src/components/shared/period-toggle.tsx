import { cn } from "@/lib/utils";

export type ExpensePeriodFilter = "WEEKLY" | "MONTHLY" | "ALL";

const OPTIONS: { value: ExpensePeriodFilter; label: string }[] = [
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "ALL", label: "All" },
];

interface PeriodToggleProps {
  value: ExpensePeriodFilter;
  onChange: (value: ExpensePeriodFilter) => void;
  className?: string;
  /** Hide "All" — use on add/edit forms */
  hideAll?: boolean;
}

export function PeriodToggle({ value, onChange, className, hideAll = false }: PeriodToggleProps) {
  const options = hideAll ? OPTIONS.filter((o) => o.value !== "ALL") : OPTIONS;

  return (
    <div
      className={cn(
        "flex w-full max-w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] p-0.5 sm:inline-flex sm:w-auto",
        className
      )}
      role="tablist"
      aria-label="Expense period"
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "min-h-[40px] flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors sm:min-h-0 sm:flex-none sm:py-1.5",
            value === opt.value
              ? "bg-[var(--color-card)] text-[var(--color-foreground)] shadow-sm"
              : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
