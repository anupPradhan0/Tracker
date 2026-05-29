import { z } from "zod";

export const aiSummaryRequestSchema = z.object({
  period: z.enum(["WEEKLY", "MONTHLY"]),
});

export const upsertAiKeySchema = z.object({
  apiKey: z.string().min(10, "API key is too short"),
});

export type AiSummaryRequestInput = z.infer<typeof aiSummaryRequestSchema>;
