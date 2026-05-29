import { Router } from "express";
import authRoutes from "./authRoutes.js";
import trackerRoutes from "./trackerRoutes.js";
import aiRoutes from "./aiRoutes.js";
import cronRoutes from "./cronRoutes.js";
import { healthCheck } from "../controllers/authController.js";

const router = Router();

router.get("/health", healthCheck);
router.use("/auth", authRoutes);
router.use("/tracker", trackerRoutes);
router.use("/ai", aiRoutes);
router.use("/cron", cronRoutes);

export default router;
