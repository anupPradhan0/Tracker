import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
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
import { PeriodToggle } from "@/components/shared/period-toggle";
import { PageHeader } from "@/components/shared/page-header";
import { NativeSelect } from "@/components/shared/native-select";
import { StickyFormActions } from "@/components/shared/sticky-form-actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type FormData = z.infer<typeof createExpenseSchema>;

function parsePeriodParam(value: string | null): "WEEKLY" | "MONTHLY" {
  return value === "WEEKLY" ? "WEEKLY" : "MONTHLY";
}

function parseDateParam(value: string | null): string | undefined {
  if (!value) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return undefined;
}

function getTodayIso() {
  return new Date().toISOString().split("T")[0]!;
}

function clampIsoDate(desired: string, range?: { from?: string; to?: string }) {
  if (range?.from && desired < range.from) return range.from;
  if (range?.to && desired > range.to) return range.to;
  return desired;
}

export function ExpenseFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
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

  const defaultPeriod = expense?.period ?? parsePeriodParam(searchParams.get("period"));
  const defaultDateParam = parseDateParam(searchParams.get("date"));
  const rangeFrom = parseDateParam(searchParams.get("from"));
  const rangeTo = parseDateParam(searchParams.get("to"));
  const hasRange = !!rangeFrom || !!rangeTo;
  const lockPeriod = !isEdit && searchParams.has("period");
  const resolvedDefaultDate = clampIsoDate(defaultDateParam ?? getTodayIso(), {
    from: rangeFrom,
    to: rangeTo,
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(createExpenseSchema),
    values: expense
      ? {
          amount: parseFloat(expense.amount),
          description: expense.description ?? undefined,
          date: expense.date.split("T")[0]!,
          categoryId: expense.categoryId,
          period: expense.period,
        }
      : {
          amount: 0,
          date: resolvedDefaultDate,
          categoryId: categories?.[0]?.id ?? "",
          period: defaultPeriod,
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

  const periodDescription = lockPeriod
    ? defaultPeriod === "WEEKLY"
      ? "Adding for the week you selected"
      : "Adding for the month you selected"
    : undefined;

  return (
    <div className="space-y-5 pb-4 sm:space-y-6 sm:pb-0">
      <PageHeader
        title={isEdit ? "Edit expense" : "Add expense"}
        description={periodDescription}
        backTo="/expenses"
        backLabel="Expenses"
      />

      <Card>
        <CardHeader className="flex flex-col gap-3 space-y-0 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Details</CardTitle>
          {!lockPeriod && (
            <Controller
              name="period"
              control={control}
              render={({ field }) => (
                <PeriodToggle
                  hideAll
                  value={field.value}
                  onChange={field.onChange}
                  className={cn(
                    "sm:shrink-0",
                    errors.period && "ring-2 ring-[var(--color-destructive)]"
                  )}
                />
              )}
            />
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                inputMode="decimal"
                {...register("amount", { valueAsNumber: true })}
              />
              {errors.amount && (
                <p className="text-xs text-[var(--color-destructive)]">{errors.amount.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" {...register("description")} placeholder="Optional" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                min={hasRange ? rangeFrom : undefined}
                max={hasRange ? rangeTo : undefined}
                {...register("date")}
              />
              {errors.date && (
                <p className="text-xs text-[var(--color-destructive)]">{errors.date.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <NativeSelect id="category" {...register("categoryId")}>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </NativeSelect>
              {errors.categoryId && (
                <p className="text-xs text-[var(--color-destructive)]">{errors.categoryId.message}</p>
              )}
            </div>
            <StickyFormActions>
              <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
            </StickyFormActions>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
