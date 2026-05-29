import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { generateDailySchema, generateWeeklySchema } from "../validators/ai.validator.js";
import {
  getAiStatus,
  getDailySummaries,
  getWeeklySummaries,
  postDailySummary,
  postWeeklySummary,
} from "../controllers/aiController.js";

const router = Router();

router.use(authMiddleware);

router.get("/status", getAiStatus);
router.get("/summary/daily", getDailySummaries);
router.get("/summary/weekly", getWeeklySummaries);
router.post("/summary/weekly", validateBody(generateWeeklySchema), postWeeklySummary);
router.post("/summary/daily", validateBody(generateDailySchema), postDailySummary);

export default router;
