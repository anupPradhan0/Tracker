import { z } from "zod";

export const generateWeeklySchema = z.object({
  pageId: z.string().min(1),
});

export const generateDailySchema = z.object({
  pageId: z.string().min(1),
  dayIndex: z.coerce.number().int().min(1).max(7),
});

export type GenerateWeeklyInput = z.infer<typeof generateWeeklySchema>;
export type GenerateDailyInput = z.infer<typeof generateDailySchema>;
