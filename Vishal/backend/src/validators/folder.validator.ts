import { z } from "zod";

export const createFolderSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  parentFolderId: z.string().min(1).nullable().optional(),
});

export const updateFolderSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  parentFolderId: z.string().min(1).nullable().optional(),
  isExpanded: z.boolean().optional(),
});

export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>;
