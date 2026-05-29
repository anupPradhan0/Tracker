import { z } from "zod";

export const createPageSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  icon: z.string().trim().max(8).optional(),
});

export const updatePageSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  icon: z.string().trim().max(8).optional(),
});

export const createEntrySchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  description: z.string().trim().max(1000).optional().default(""),
  category: z.string().trim().max(100).optional().default(""),
  tags: z.array(z.string().trim().max(50)).max(20).optional().default([]),
});

export const updateEntrySchema = createEntrySchema.partial();

const fixedExpenseSchema = z.object({
  title: z.string().trim().min(1).max(120),
  amount: z.coerce.number().min(0),
});

export const updateSettingsSchema = z.object({
  currency: z.string().trim().min(1).max(5).optional(),
  monthlyBudget: z.coerce.number().min(0).optional(),
  fixedExpenses: z.array(fixedExpenseSchema).max(50).optional(),
  weeklyReportsEnabled: z.boolean().optional(),
});

export const exportPdfSchema = z.object({
  pageId: z.string().min(1),
});

export const sendEmailSchema = z.object({
  pageId: z.string().min(1).optional(),
});

export const dayIndexParamSchema = z.coerce
  .number()
  .int()
  .min(1, "Day index must be 1–7")
  .max(7, "Day index must be 1–7");

export type CreatePageInput = z.infer<typeof createPageSchema>;
export type UpdatePageInput = z.infer<typeof updatePageSchema>;
export type CreateEntryInput = z.infer<typeof createEntrySchema>;
export type UpdateEntryInput = z.infer<typeof updateEntrySchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
