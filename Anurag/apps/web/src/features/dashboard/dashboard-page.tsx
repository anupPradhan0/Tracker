import { Link } from "react-router-dom";
import { AlertTriangle, Plus, Sparkles } from "lucide-react";
import { formatCurrency } from "@anurag/utils";
import { useAnalyticsSummary } from "@/hooks/use-analytics";
import { useAuthStore } from "@/stores/auth-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiPost } from "@/lib/api-client";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useAnalyticsSummary();
  const currency = user?.currency ?? "INR";

  const sendEmail = useMutation({
    mutationFn: () => apiPost("/email/ai-summary", { period: "MONTHLY" }),
    onSuccess: () => toast.success("AI summary sent to your email!"),
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hi, {user?.name?.split(" ")[0]}</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">Your spending overview</p>
      </div>

      {data?.budgetExceeded && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">You&apos;ve exceeded your monthly budget</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
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
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link to="/expenses/new">
            <Plus className="h-4 w-4" />
            Add expense
          </Link>
        </Button>
        <Button
          variant="outline"
          onClick={() => sendEmail.mutate()}
          disabled={sendEmail.isPending}
        >
          <Sparkles className="h-4 w-4" />
          Send AI Summary
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data?.recentExpenses?.length ? (
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
