import { Router } from "express";
import { runWeeklyEmailCron } from "../controllers/cronController.js";

const router = Router();

router.get("/weekly-email", runWeeklyEmailCron);

export default router;
