import { Router } from "express";
import { z } from "zod";
import { validate } from "../../common/middleware/validate.js";
import { authenticate } from "../../common/middleware/auth.js";
import { emailController } from "./email.controller.js";

const sendSchema = z.object({
  period: z.enum(["WEEKLY", "MONTHLY"]).optional(),
});

export const emailRoutes = Router();

emailRoutes.use(authenticate);
emailRoutes.post("/ai-summary", validate(sendSchema), emailController.sendAiSummary);
emailRoutes.get("/logs", emailController.logs);
