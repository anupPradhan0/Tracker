import { Router } from "express";
import { register, login, getMe, logout } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { loginSchema, registerSchema } from "../validators/auth.validator.js";

const router = Router();

router.post("/register", validateBody(registerSchema), register);
router.post("/login", validateBody(loginSchema), login);
router.get("/me", authMiddleware, getMe);
router.post("/logout", logout);

export default router;
