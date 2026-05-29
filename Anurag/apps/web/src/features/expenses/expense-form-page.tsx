import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createExpenseSchema } from "@anurag/types";
import type { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import type { CategoryDto, ExpenseDto } from "@anurag/types";
import { useCreateExpense, useUpdateExpense } from "@/hooks/use-expenses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

type FormData = z.infer<typeof createExpenseSchema>;

export function ExpenseFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const create = useCreateExpense();
  const update = useUpdateExpense(id ?? "");

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => apiGet<CategoryDto[]>("/categories").then((r) => r.data),
  });

  const { data: expense } = useQuery({
    queryKey: ["expenses", id],
    queryFn: () => apiGet<ExpenseDto>(`/expenses/${id}`).then((r) => r.data),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(createExpenseSchema),
    values: expense
      ? {
          amount: parseFloat(expense.amount),
          description: expense.description ?? undefined,
          date: expense.date.split("T")[0]!,
          categoryId: expense.categoryId,
        }
      : {
          amount: 0,
          date: new Date().toISOString().split("T")[0]!,
          categoryId: categories?.[0]?.id ?? "",
        },
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (isEdit) {
        await update.mutateAsync(data);
        toast.success("Expense updated");
      } else {
        await create.mutateAsync(data);
        toast.success("Expense added");
      }
      navigate("/expenses");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    }
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{isEdit ? "Edit expense" : "Add expense"}</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" step="0.01" {...register("amount", { valueAsNumber: true })} />
              {errors.amount && <p className="text-xs text-[var(--color-destructive)]">{errors.amount.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input {...register("description")} placeholder="Optional" />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" {...register("date")} />
              {errors.date && <p className="text-xs text-[var(--color-destructive)]">{errors.date.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <select
                className="flex h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 text-sm"
                {...register("categoryId")}
              >
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && <p className="text-xs text-[var(--color-destructive)]">{errors.categoryId.message}</p>}
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
