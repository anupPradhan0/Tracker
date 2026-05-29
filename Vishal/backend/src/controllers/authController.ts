import type { Request, Response } from "express";
import { env } from "../config/env.js";
import { findUserById } from "../services/userService.js";
import { clearAuthCookie, setAuthCookie } from "../services/tokenService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { ApiError } from "../utils/ApiError.js";

interface GoogleAuthUser {
  token: string;
}

export const googleCallback = asyncHandler(async (req: Request, res: Response) => {
  const authUser = req.user as unknown as GoogleAuthUser | undefined;

  if (!authUser?.token) {
    throw new ApiError(401, "AUTH_FAILED", "Google authentication failed");
  }

  setAuthCookie(res, authUser.token);
  res.redirect(`${env.FRONTEND_URL}/dashboard`);
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  }

  const user = await findUserById(req.user.id);
  if (!user) {
    throw new ApiError(404, "USER_NOT_FOUND", "User not found");
  }

  sendSuccess(res, user);
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  clearAuthCookie(res);
  sendSuccess(res, null);
});

export const healthCheck = (_req: Request, res: Response) => {
  sendSuccess(res, { status: "ok" });
};
