import { z } from "zod";

export const updateEmailSettingsSchema = z.object({
  reportSenderEmail: z.string().email("Invalid sender email").nullable().optional(),
  reportReceiverEmail: z.string().email("Invalid receiver email").nullable().optional(),
});

export type UpdateEmailSettingsInput = z.infer<typeof updateEmailSettingsSchema>;

export interface EmailSettingsDto {
  reportSenderEmail: string | null;
  reportReceiverEmail: string | null;
}
