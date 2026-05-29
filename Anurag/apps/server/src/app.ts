import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import { errorHandler } from "./common/middleware/error-handler.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { usersRoutes } from "./modules/users/users.routes.js";
import { categoriesRoutes } from "./modules/categories/categories.routes.js";
import { expensesRoutes } from "./modules/expenses/expenses.routes.js";
import { budgetsRoutes } from "./modules/budgets/budgets.routes.js";
import { analyticsRoutes } from "./modules/analytics/analytics.routes.js";
import { aiRoutes } from "./modules/ai/ai.routes.js";
import { emailRoutes } from "./modules/email/email.routes.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());
  app.use(pinoHttp());

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { success: false, error: { code: "RATE_LIMIT", message: "Too many requests" } },
  });

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { success: false, error: { code: "RATE_LIMIT", message: "Too many requests" } },
  });

  app.get("/api/v1/health", (_req, res) => {
    res.json({ success: true, data: { status: "ok", timestamp: new Date().toISOString() } });
  });

  const v1 = express.Router();
  v1.use(apiLimiter);
  v1.use("/auth", authLimiter, authRoutes);
  v1.use("/users", usersRoutes);
  v1.use("/categories", categoriesRoutes);
  v1.use("/expenses", expensesRoutes);
  v1.use("/budgets", budgetsRoutes);
  v1.use("/analytics", analyticsRoutes);
  v1.use("/ai", aiRoutes);
  v1.use("/email", emailRoutes);

  app.use("/api/v1", v1);
  app.use(errorHandler);

  return app;
}
