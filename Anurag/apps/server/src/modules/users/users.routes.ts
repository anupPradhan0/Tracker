import { Router } from "express";
import { z } from "zod";
import { updateProfileSchema, upsertAiKeySchema, updateEmailSettingsSchema } from "@anurag/types";
import { validate } from "../../common/middleware/validate.js";
import { authenticate } from "../../common/middleware/auth.js";
import { usersController } from "./users.controller.js";

const providerParam = z.object({
  provider: z.enum(["gemini", "openai", "cohere"]),
});

export const usersRoutes = Router();

usersRoutes.use(authenticate);

usersRoutes.patch("/me", validate(updateProfileSchema), usersController.updateProfile);
usersRoutes.get("/me/email-settings", usersController.getEmailSettings);
usersRoutes.patch(
  "/me/email-settings",
  validate(updateEmailSettingsSchema),
  usersController.updateEmailSettings
);
usersRoutes.get("/me/ai-keys/status", usersController.aiKeyStatus);
usersRoutes.put(
  "/me/ai-keys/:provider",
  validate(providerParam, "params"),
  validate(upsertAiKeySchema),
  usersController.upsertAiKey
);
usersRoutes.delete(
  "/me/ai-keys/:provider",
  validate(providerParam, "params"),
  usersController.deleteAiKey
);
