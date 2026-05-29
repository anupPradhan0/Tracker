import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client";
import type { ExpenseDto, PaginationMeta } from "@anurag/types";

export const expenseKeys = {
  all: ["expenses"] as const,
  list: (params?: Record<string, unknown>) => [...expenseKeys.all, "list", params] as const,
  detail: (id: string) => [...expenseKeys.all, id] as const,
};

export function useExpenses(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: expenseKeys.list(params),
    queryFn: async () => {
      const result = await apiGet<ExpenseDto[]>("/expenses", params);
      return { items: result.data, meta: result.meta as PaginationMeta | undefined };
    },
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) => apiPost<ExpenseDto>("/expenses", body),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: expenseKeys.all });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: expenseKeys.all }),
  });
}

export function useUpdateExpense(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) => apiPatch<ExpenseDto>(`/expenses/${id}`, body),
    onSettled: () => qc.invalidateQueries({ queryKey: expenseKeys.all }),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/expenses/${id}`),
    onSettled: () => qc.invalidateQueries({ queryKey: expenseKeys.all }),
  });
}
