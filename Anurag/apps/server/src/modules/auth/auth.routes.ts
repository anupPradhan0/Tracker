import { Router } from "express";
import { registerSchema, loginSchema } from "@anurag/types";
import { validate } from "../../common/middleware/validate.js";
import { authenticate } from "../../common/middleware/auth.js";
import { authController } from "./auth.controller.js";

export const authRoutes = Router();

authRoutes.post("/register", validate(registerSchema), authController.register);
authRoutes.post("/login", validate(loginSchema), authController.login);
authRoutes.post("/refresh", authController.refresh);
authRoutes.post("/logout", authController.logout);
authRoutes.get("/me", authenticate, authController.me);
