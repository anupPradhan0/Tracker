import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";
import { verifyToken } from "../services/tokenService.js";

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  try {
    const token = req.cookies?.[env.COOKIE_NAME];

    if (!token || typeof token !== "string") {
      throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
    }

    const payload = verifyToken(token);
    req.user = { id: payload.sub, email: payload.email, sub: payload.sub };
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
      return;
    }
    next(new ApiError(401, "UNAUTHORIZED", "Invalid or expired token"));
  }
}
