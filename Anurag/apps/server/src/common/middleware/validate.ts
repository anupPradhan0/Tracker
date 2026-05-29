import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";
import { AppError } from "../errors/app-error.js";

type RequestPart = "body" | "query" | "params";

export function validate(schema: ZodSchema, part: RequestPart = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      return next(
        AppError.badRequest("Validation failed", "VALIDATION_ERROR", result.error.flatten())
      );
    }
    req[part] = result.data;
    next();
  };
}
