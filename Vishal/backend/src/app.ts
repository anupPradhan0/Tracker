import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { corsMiddleware } from "./config/cors.js";
import apiRoutes from "./routes/index.js";
import { notFoundHandler } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(
  helmet({
    // Allow the Vite dev server (different port) to read API responses.
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(corsMiddleware);
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser(env.COOKIE_SECRET));

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS",
  message: {
    success: false,
    error: { code: "RATE_LIMIT", message: "Too many requests, please try again later" },
  },
});

app.use("/api/auth", authRateLimiter);
app.use("/api", apiRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
