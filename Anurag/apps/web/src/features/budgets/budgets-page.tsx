import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPut } from "@/lib/api-client";
import { formatCurrency } from "@anurag/utils";
import { useAuthStore } from "@/stores/auth-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { toast } from "sonner";

interface BudgetData {
  year: number;
  month: number;
  amount: string;
  spent: string;
  remaining: string | null;
  exceeded: boolean;
  currency: string;
}

export function BudgetsPage() {
  const user = useAuthStore((s) => s.user);
  const currency = user?.currency ?? "INR";
  const now = new Date();
  const [amount, setAmount] = useState("");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["budget", "current"],
    queryFn: () => apiGet<BudgetData>("/budgets/current").then((r) => r.data),
  });

  const save = useMutation({
    mutationFn: (amt: number) =>
      apiPut(`/budgets/${now.getFullYear()}/${now.getMonth() + 1}`, { amount: amt }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budget"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
      toast.success("Budget saved");
      setAmount("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const spentPct =
    data && parseFloat(data.amount) > 0
      ? Math.min(100, (parseFloat(data.spent) / parseFloat(data.amount)) * 100)
      : 0;

  const monthLabel = now.toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader title="Monthly budget" description={monthLabel} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{monthLabel}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">Loading...</p>
          ) : (
            <>
              <div>
                <div className="mb-2 flex flex-col gap-1 text-sm sm:flex-row sm:justify-between">
                  <span>Spent: {formatCurrency(data?.spent ?? "0", currency)}</span>
                  <span>Budget: {formatCurrency(data?.amount ?? "0", currency)}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-[var(--color-muted)]">
                  <div
                    className={`h-full transition-all ${data?.exceeded ? "bg-[var(--color-destructive)]" : "bg-[var(--color-primary)]"}`}
                    style={{ width: `${spentPct}%` }}
                  />
                </div>
                {data?.remaining != null && (
                  <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                    Remaining: {formatCurrency(data.remaining, currency)}
                  </p>
                )}
              </div>

              <div className="space-y-2 border-t border-[var(--color-border)] pt-4">
                <Label htmlFor="budget-amount">Set monthly limit</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    id="budget-amount"
                    type="number"
                    inputMode="decimal"
                    placeholder="e.g. 50000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    className="w-full sm:w-auto sm:shrink-0"
                    onClick={() => save.mutate(parseFloat(amount))}
                    disabled={!amount || save.isPending}
                  >
                    Save
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
