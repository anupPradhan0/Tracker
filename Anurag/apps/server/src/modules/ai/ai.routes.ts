import { Router } from "express";
import { aiSummaryRequestSchema } from "@anurag/types";
import { validate } from "../../common/middleware/validate.js";
import { authenticate } from "../../common/middleware/auth.js";
import { aiController } from "./ai.controller.js";

export const aiRoutes = Router();

aiRoutes.use(authenticate);
aiRoutes.post("/summary", validate(aiSummaryRequestSchema), aiController.generate);
aiRoutes.get("/summaries", aiController.list);
