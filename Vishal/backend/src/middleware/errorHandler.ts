import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError.js";
import type { ApiErrorBody } from "../types/api.js";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ApiError) {
    const body: ApiErrorBody = {
      success: false,
      error: { code: err.code, message: err.message },
    };
    res.status(err.statusCode).json(body);
    return;
  }

  if (err instanceof ZodError) {
    const body: ApiErrorBody = {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: err.errors.map((e) => e.message).join(", "),
      },
    };
    res.status(400).json(body);
    return;
  }

  console.error(err);

  const body: ApiErrorBody = {
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message:
        process.env.NODE_ENV === "production"
          ? "An unexpected error occurred"
          : err.message,
    },
  };
  res.status(500).json(body);
}
