import { z } from "zod";

export const upsertBudgetSchema = z.object({
  amount: z.coerce.number().nonnegative("Amount must be non-negative"),
  currency: z.string().length(3).optional(),
});

export const budgetParamsSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

export type UpsertBudgetInput = z.infer<typeof upsertBudgetSchema>;
