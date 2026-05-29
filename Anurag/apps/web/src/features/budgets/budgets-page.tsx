import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPut } from "@/lib/api-client";
import { formatCurrency } from "@anurag/utils";
import { useAuthStore } from "@/stores/auth-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Monthly budget</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {now.toLocaleString("en-US", { month: "long", year: "numeric" })}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">Loading...</p>
          ) : (
            <>
              <div>
                <div className="mb-2 flex justify-between text-sm">
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
                <Label>Set monthly limit</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="e.g. 50000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  <Button
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
