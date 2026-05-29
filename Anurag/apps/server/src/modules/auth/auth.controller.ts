import type { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service.js";
import { sendSuccess } from "../../common/utils/response.js";
import { env } from "../../config/env.js";

const REFRESH_COOKIE = "refreshToken";

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/v1/auth",
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, { path: "/api/v1/auth" });
}

export class AuthController {
  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, name } = req.body;
      const result = await authService.register(email, password, name);
      setRefreshCookie(res, result.refreshToken);
      sendSuccess(res, { accessToken: result.accessToken, user: result.user }, 201);
    } catch (e) {
      next(e);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      setRefreshCookie(res, result.refreshToken);
      sendSuccess(res, { accessToken: result.accessToken, user: result.user });
    } catch (e) {
      next(e);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.cookies[REFRESH_COOKIE];
      if (!token) return next(new Error("No refresh token"));
      const result = await authService.refresh(token);
      setRefreshCookie(res, result.refreshToken);
      sendSuccess(res, { accessToken: result.accessToken, user: result.user });
    } catch (e) {
      next(e);
    }
  };

  logout = async (_req: Request, res: Response) => {
    clearRefreshCookie(res);
    sendSuccess(res, { message: "Logged out" });
  };

  me = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await authService.getMe(req.user!.userId);
      sendSuccess(res, user);
    } catch (e) {
      next(e);
    }
  };
}

export const authController = new AuthController();
