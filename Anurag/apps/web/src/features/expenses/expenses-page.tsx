import { Link } from "react-router-dom";
import { Plus, Receipt } from "lucide-react";
import { formatCurrency } from "@anurag/utils";
import { useExpenses, useDeleteExpense } from "@/hooks/use-expenses";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "sonner";

export function ExpensesPage() {
  const currency = useAuthStore((s) => s.user?.currency) ?? "INR";
  const { data, isLoading } = useExpenses({ sort: "date_desc", limit: 50 });
  const deleteExpense = useDeleteExpense();

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this expense?")) return;
    try {
      await deleteExpense.mutateAsync(id);
      toast.success("Expense deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Expenses</h1>
        <Button asChild size="sm">
          <Link to="/expenses/new">
            <Plus className="h-4 w-4" />
            Add
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : !data?.items.length ? (
        <EmptyState
          icon={Receipt}
          title="No expenses yet"
          description="Track your first purchase to see it here."
          action={
            <Button asChild>
              <Link to="/expenses/new">Add expense</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {data.items.map((e) => (
            <Card key={e.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{e.description || e.category?.name}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {e.category?.name} · {new Date(e.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{formatCurrency(e.amount, e.currency || currency)}</span>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/expenses/${e.id}/edit`}>Edit</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[var(--color-destructive)]"
                    onClick={() => handleDelete(e.id)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
