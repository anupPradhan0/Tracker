import { Link } from "react-router-dom";
import { AlertTriangle, Mail, Plus } from "lucide-react";
import { formatCurrency } from "@anurag/utils";
import { useAnalyticsSummary } from "@/hooks/use-analytics";
import { useSendExpenseEmail } from "@/hooks/use-send-expense-email";
import { useAuthStore } from "@/stores/auth-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/page-header";

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, isFetching } = useAnalyticsSummary();
  const currency = user?.currency ?? "INR";
  const sendEmail = useSendExpenseEmail("MONTHLY");
  const statsLoading = isLoading && !data;

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title={`Hi, ${user?.name?.split(" ")[0] ?? "there"}`}
        description="Your spending overview"
        actions={
          <>
            <Button asChild className="w-full sm:w-auto">
              <Link to="/expenses/new">
                <Plus className="h-4 w-4" />
                Add expense
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => sendEmail.mutate()}
              disabled={sendEmail.isPending}
            >
              <Mail className="h-4 w-4" />
              {sendEmail.isPending ? "Sending…" : "Send report"}
            </Button>
          </>
        }
      />

      {data?.budgetExceeded && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm font-medium leading-snug">
            You&apos;ve exceeded your monthly budget
          </p>
        </div>
      )}

      {isError && !data && (
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Could not load stats. Check that the API and database are running.
        </p>
      )}

      {isFetching && data && (
        <p className="text-xs text-[var(--color-muted-foreground)]">Updating…</p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-2">
        {statsLoading ? (
          [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl sm:h-28" />)
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-[var(--color-muted-foreground)] sm:text-sm">
                  This month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold sm:text-2xl">
                  {formatCurrency(data?.monthlyTotal ?? "0", currency)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-[var(--color-muted-foreground)] sm:text-sm">
                  This week
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold sm:text-2xl">
                  {formatCurrency(data?.weeklyTotal ?? "0", currency)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-[var(--color-muted-foreground)] sm:text-sm">
                  Remaining
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold sm:text-2xl">
                  {data?.remainingBudget != null
                    ? formatCurrency(data.remainingBudget, currency)
                    : "—"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-[var(--color-muted-foreground)] sm:text-sm">
                  Top category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base font-semibold sm:text-lg">{data?.topCategories[0]?.name ?? "—"}</p>
                {data?.topCategories[0] && (
                  <p className="text-xs text-[var(--color-muted-foreground)] sm:text-sm">
                    {formatCurrency(data.topCategories[0].total, currency)}
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {statsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : data?.recentExpenses?.length ? (
            data.recentExpenses.map((e) => (
              <div
                key={e.id}
                className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] pb-3 text-sm last:border-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-snug">
                    {e.description || e.category?.name || "Expense"}
                  </p>
                  <p className="text-[var(--color-muted-foreground)]">
                    {new Date(e.date).toLocaleDateString()}
                  </p>
                </div>
                <span className="shrink-0 font-semibold">
                  {formatCurrency(e.amount, e.currency)}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-[var(--color-muted-foreground)]">No expenses yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
