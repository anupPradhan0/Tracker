import { Router } from "express";
import authRoutes from "./authRoutes.js";
import { healthCheck } from "../controllers/authController.js";

const router = Router();

router.get("/health", healthCheck);
router.use("/auth", authRoutes);

export default router;
