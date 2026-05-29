import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import {
  generateDailySummary,
  generateWeeklySummary,
  listSummaries,
} from "../services/aiSummaryService.js";
import { isCohereConfigured } from "../services/cohereService.js";
import type { GenerateDailyInput, GenerateWeeklyInput } from "../validators/ai.validator.js";

function requireUserId(req: Request): string {
  if (!req.user?.id) {
    throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  }
  return req.user.id;
}

export const getAiStatus = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, {
    configured: isCohereConfigured(),
    provider: "cohere",
  });
});

export const getDailySummaries = asyncHandler(async (req: Request, res: Response) => {
  const limit = Math.min(parseInt((req.query.limit as string) || "7", 10), 20);
  const summaries = await listSummaries(requireUserId(req), "daily", limit);
  sendSuccess(res, summaries);
});

export const getWeeklySummaries = asyncHandler(async (req: Request, res: Response) => {
  const limit = Math.min(parseInt((req.query.limit as string) || "4", 10), 20);
  const summaries = await listSummaries(requireUserId(req), "weekly", limit);
  sendSuccess(res, summaries);
});

export const postWeeklySummary = asyncHandler(async (req: Request, res: Response) => {
  const { pageId } = req.body as GenerateWeeklyInput;
  const summary = await generateWeeklySummary(requireUserId(req), pageId);
  sendSuccess(res, summary, 201);
});

export const postDailySummary = asyncHandler(async (req: Request, res: Response) => {
  const { pageId, dayIndex } = req.body as GenerateDailyInput;
  const summary = await generateDailySummary(requireUserId(req), pageId, dayIndex);
  sendSuccess(res, summary, 201);
});
