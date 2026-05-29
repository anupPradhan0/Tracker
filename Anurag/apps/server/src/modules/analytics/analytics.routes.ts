import { Router } from "express";
import { authenticate } from "../../common/middleware/auth.js";
import { analyticsController } from "./analytics.controller.js";

export const analyticsRoutes = Router();

analyticsRoutes.use(authenticate);
analyticsRoutes.get("/summary", analyticsController.summary);
analyticsRoutes.get("/trends", analyticsController.trends);
analyticsRoutes.get("/by-category", analyticsController.byCategory);
