import type { Request, Response } from "express";
import { loginUser, registerUser } from "../services/authService.js";
import { findUserById } from "../services/userService.js";
import { clearAuthCookie, setAuthCookie } from "../services/tokenService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import type { LoginInput, RegisterInput } from "../validators/auth.validator.js";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as RegisterInput;
  const { user, token } = await registerUser(body);
  setAuthCookie(res, token);
  sendSuccess(res, { user }, 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as LoginInput;
  const { user, token } = await loginUser(body);
  setAuthCookie(res, token);
  sendSuccess(res, { user });
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
