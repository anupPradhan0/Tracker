import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";

export function validateBody<T>(schema: ZodSchema<T>) {
  return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    req.body = await schema.parseAsync(req.body);
    next();
  });
}
