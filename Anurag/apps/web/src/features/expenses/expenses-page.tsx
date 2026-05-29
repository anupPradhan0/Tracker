import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Receipt } from "lucide-react";
import {
  formatCurrency,
  formatLocalDate,
  parseMonthKey,
  toISODateString,
  toMonthKey,
} from "@anurag/utils";
import { useExpenses, useDeleteExpense } from "@/hooks/use-expenses";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type WeekFilter = "ALL" | "W1" | "W2" | "W3" | "W4";

function monthStartEnd(monthValue: string) {
  const [y, m] = monthValue.split("-").map((n) => Number(n));
  const start = new Date(y!, (m ?? 1) - 1, 1, 0, 0, 0, 0);
  const end = new Date(y!, (m ?? 1), 0, 23, 59, 59, 999);
  return { start, end };
}

function weekRangeInMonth(monthValue: string, week: Exclude<WeekFilter, "ALL">) {
  const { start, end } = monthStartEnd(monthValue);
  const dayStart = start.getDate();
  const lastDay = end.getDate();
  const idx = week === "W1" ? 0 : week === "W2" ? 1 : week === "W3" ? 2 : 3;
  const fromDay = dayStart + idx * 7;
  const toDay = week === "W4" ? lastDay : Math.min(fromDay + 6, lastDay);
  const from = new Date(start.getFullYear(), start.getMonth(), fromDay, 0, 0, 0, 0);
  const to = new Date(start.getFullYear(), start.getMonth(), toDay, 23, 59, 59, 999);
  return { start: from, end: to };
}

/** Dropdown options — avoids native `type="month"` overflow on small screens */
function buildMonthOptions(count = 24) {
  const options: { value: string; label: string }[] = [];
  const cursor = new Date();
  cursor.setDate(1);
  for (let i = 0; i < count; i++) {
    const y = cursor.getFullYear();
    const m = cursor.getMonth() + 1;
    options.push({
      value: `${y}-${String(m).padStart(2, "0")}`,
      label: cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    });
    cursor.setMonth(cursor.getMonth() - 1);
  }
  return options;
}

const MONTH_OPTIONS = buildMonthOptions();

export function ExpensesPage() {
  const currency = useAuthStore((s) => s.user?.currency) ?? "INR";
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [month, setMonth] = useState(() => toMonthKey(new Date()));
  const [week, setWeek] = useState<WeekFilter>("ALL");

  const dateRange = week === "ALL" ? monthStartEnd(month) : weekRangeInMonth(month, week);

  const { data, isLoading } = useExpenses({
    sort: "date_desc",
    limit: 50,
    from: toISODateString(dateRange.start),
    to: toISODateString(dateRange.end),
  });
  const deleteExpense = useDeleteExpense();

  const monthOptions = useMemo(() => {
    if (MONTH_OPTIONS.some((o) => o.value === month)) return MONTH_OPTIONS;
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y!, (m ?? 1) - 1, 1);
    const extra = {
      value: month,
      label: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    };
    return [extra, ...MONTH_OPTIONS.filter((o) => o.value !== month)];
  }, [month]);

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await deleteExpense.mutateAsync(deleteId);
      toast.success("Expense deleted");
      setDeleteId(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  const addPeriod = week === "ALL" ? "MONTHLY" : "WEEKLY";
  const todayIso = toISODateString(new Date());
  const fromIso = toISODateString(dateRange.start);
  const toIso = toISODateString(dateRange.end);
  const defaultDate = todayIso >= fromIso && todayIso <= toIso ? todayIso : fromIso;
  const addHref = `/expenses/new?period=${addPeriod}&date=${encodeURIComponent(
    defaultDate
  )}&from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`;

  const monthLabel = parseMonthKey(month);
  const periodHint =
    week === "ALL"
      ? monthLabel.toLocaleDateString("en-US", { month: "long", year: "numeric" })
      : `${week.replace("W", "Week ")} · ${monthLabel.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;

  return (
    <div className="min-w-0 max-w-full space-y-5 overflow-x-hidden sm:space-y-6">
      <PageHeader
        title="Expenses"
        description={periodHint}
        actions={
          <Button asChild className="w-full sm:w-auto">
            <Link to={addHref}>
              <Plus className="h-4 w-4" />
              Add expense
            </Link>
          </Button>
        }
      />

      <Card className="min-w-0 overflow-hidden">
        <CardContent className="flex min-w-0 flex-col gap-3 p-4 sm:grid sm:grid-cols-2 sm:gap-4">
          <div className="min-w-0 w-full space-y-1.5">
            <Label htmlFor="month">Month</Label>
            <Select
              value={month}
              onValueChange={(value) => {
                setMonth(value);
                setWeek("ALL");
              }}
            >
              <SelectTrigger id="month" aria-label="Month">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-0 w-full space-y-1.5">
            <Label htmlFor="week">Week</Label>
            <Select value={week} onValueChange={(value) => setWeek(value as WeekFilter)}>
              <SelectTrigger id="week" aria-label="Week">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All weeks</SelectItem>
                <SelectItem value="W1">Week 1</SelectItem>
                <SelectItem value="W2">Week 2</SelectItem>
                <SelectItem value="W3">Week 3</SelectItem>
                <SelectItem value="W4">Week 4</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl sm:h-20" />
          ))}
        </div>
      ) : !data?.items.length ? (
        <EmptyState
          icon={Receipt}
          title="No expenses yet"
          description={
            week === "ALL"
              ? "No expenses for this month. Add one for the period you selected."
              : "No expenses for this week. Add one for the period you selected."
          }
          action={
            <Button asChild className="w-full max-w-xs sm:w-auto">
              <Link to={addHref}>Add expense</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {data.items.map((e) => (
            <Card key={e.id} className="min-w-0 overflow-hidden">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-snug break-words">
                    {e.description || e.category?.name}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
                    {e.category?.name} · {formatLocalDate(e.date)} ·{" "}
                    <span className="capitalize">{e.period.toLowerCase()}</span>
                  </p>
                  <p className="mt-2 text-lg font-semibold sm:hidden">
                    {formatCurrency(e.amount, e.currency || currency)}
                  </p>
                </div>
                <div className="flex min-w-0 items-center justify-between gap-2 border-t border-[var(--color-border)] pt-3 sm:shrink-0 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                  <span className="hidden font-semibold sm:block sm:text-base">
                    {formatCurrency(e.amount, e.currency || currency)}
                  </span>
                  <div className="flex w-full min-w-0 gap-2 sm:w-auto">
                    <Button variant="outline" className="min-h-[44px] min-w-0 flex-1 sm:flex-none" asChild>
                      <Link to={`/expenses/${e.id}/edit`}>Edit</Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="min-h-[44px] min-w-0 flex-1 text-[var(--color-destructive)] sm:flex-none"
                      onClick={() => setDeleteId(e.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete expense?"
        description="This action cannot be undone. The expense will be permanently removed."
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteExpense.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
