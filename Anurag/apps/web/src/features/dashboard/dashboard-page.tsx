import { Link } from "react-router-dom";
import { AlertTriangle, Mail, Plus } from "lucide-react";
import { formatCurrency } from "@anurag/utils";
import { useAnalyticsSummary } from "@/hooks/use-analytics";
import { useSendExpenseEmail } from "@/hooks/use-send-expense-email";
import { useAuthStore } from "@/stores/auth-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, isFetching } = useAnalyticsSummary();
  const currency = user?.currency ?? "INR";
  const sendEmail = useSendExpenseEmail("MONTHLY");
  const statsLoading = isLoading && !data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hi, {user?.name?.split(" ")[0]}</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">Your spending overview</p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button asChild className="w-full sm:w-auto">
          <Link to="/expenses/new">
            <Plus className="h-4 w-4" />
            Add expense
          </Link>
        </Button>
        <Button
          variant="default"
          className="w-full sm:w-auto"
          onClick={() => sendEmail.mutate()}
          disabled={sendEmail.isPending}
        >
          <Mail className="h-4 w-4" />
          {sendEmail.isPending ? "Sending…" : "Send expense report"}
        </Button>
      </div>

      {data?.budgetExceeded && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">You&apos;ve exceeded your monthly budget</p>
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

      <div className="grid gap-4 sm:grid-cols-2">
        {statsLoading ? (
          [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[var(--color-muted-foreground)]">
                  This month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {formatCurrency(data?.monthlyTotal ?? "0", currency)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[var(--color-muted-foreground)]">
                  This week
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {formatCurrency(data?.weeklyTotal ?? "0", currency)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[var(--color-muted-foreground)]">
                  Remaining budget
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {data?.remainingBudget != null
                    ? formatCurrency(data.remainingBudget, currency)
                    : "—"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[var(--color-muted-foreground)]">
                  Top category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{data?.topCategories[0]?.name ?? "—"}</p>
                {data?.topCategories[0] && (
                  <p className="text-sm text-[var(--color-muted-foreground)]">
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
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : data?.recentExpenses?.length ? (
            data.recentExpenses.map((e) => (
              <div key={e.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{e.description || e.category?.name || "Expense"}</p>
                  <p className="text-[var(--color-muted-foreground)]">
                    {new Date(e.date).toLocaleDateString()}
                  </p>
                </div>
                <span className="font-medium">{formatCurrency(e.amount, e.currency)}</span>
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
