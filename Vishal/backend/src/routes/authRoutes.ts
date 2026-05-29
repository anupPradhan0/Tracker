import { Router } from "express";
import passport from "passport";
import { env } from "../config/env.js";
import { googleCallback, getMe, logout } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

router.get(
  "/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${env.FRONTEND_URL}/login?error=auth_failed`,
  }),
  googleCallback
);

router.get("/me", authMiddleware, getMe);
router.post("/logout", logout);

export default router;
