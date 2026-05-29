import type { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/app-error.js";
import { sendError } from "../utils/response.js";
import { env } from "../../config/env.js";

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.code, err.message, err.details);
  }

  console.error(err);
  return sendError(
    res,
    500,
    "INTERNAL_ERROR",
    env.NODE_ENV === "production" ? "Something went wrong" : err.message
  );
}
