import { z } from "zod";

export const expensePeriodSchema = z.enum(["WEEKLY", "MONTHLY"]);

export const createExpenseSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  description: z.string().max(500).optional(),
  date: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  categoryId: z.string().uuid(),
  period: expensePeriodSchema.default("MONTHLY"),
  currency: z.string().length(3).optional(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const expenseQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  period: expensePeriodSchema.optional(),
  sort: z.enum(["date_desc", "date_asc", "amount_desc", "amount_asc"]).default("date_desc"),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ExpenseQueryInput = z.infer<typeof expenseQuerySchema>;
