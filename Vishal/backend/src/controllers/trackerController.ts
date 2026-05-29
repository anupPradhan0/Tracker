import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import {
  createEntry,
  createPage,
  deleteEntry,
  deletePage,
  getOrCreateDefaultPage,
  getOrCreateSettings,
  getPage,
  listPages,
  updateEntry,
  updatePage,
  updateSettings,
} from "../services/trackerService.js";
import type {
  CreateEntryInput,
  CreatePageInput,
  UpdateEntryInput,
  UpdatePageInput,
  UpdateSettingsInput,
} from "../validators/tracker.validator.js";
import { dayIndexParamSchema } from "../validators/tracker.validator.js";

function requireUserId(req: Request): string {
  if (!req.user?.id) {
    throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  }
  return req.user.id;
}

export const getSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await getOrCreateSettings(requireUserId(req));
  sendSuccess(res, settings);
});

export const patchSettings = asyncHandler(async (req: Request, res: Response) => {
  const settings = await updateSettings(requireUserId(req), req.body as UpdateSettingsInput);
  sendSuccess(res, settings);
});

export const getPages = asyncHandler(async (req: Request, res: Response) => {
  const pages = await listPages(requireUserId(req));
  sendSuccess(res, pages);
});

export const getDefaultPage = asyncHandler(async (req: Request, res: Response) => {
  const page = await getOrCreateDefaultPage(requireUserId(req));
  sendSuccess(res, page);
});

export const getPageById = asyncHandler(async (req: Request, res: Response) => {
  const page = await getPage(requireUserId(req), req.params.id as string);
  sendSuccess(res, page);
});

export const postPage = asyncHandler(async (req: Request, res: Response) => {
  const page = await createPage(requireUserId(req), req.body as CreatePageInput);
  sendSuccess(res, page, 201);
});

export const patchPage = asyncHandler(async (req: Request, res: Response) => {
  const page = await updatePage(
    requireUserId(req),
    req.params.id as string,
    req.body as UpdatePageInput
  );
  sendSuccess(res, page);
});

export const removePage = asyncHandler(async (req: Request, res: Response) => {
  await deletePage(requireUserId(req), req.params.id as string);
  sendSuccess(res, { deleted: true });
});

export const postEntry = asyncHandler(async (req: Request, res: Response) => {
  const dayIndex = dayIndexParamSchema.parse(req.params.dayIndex);
  const page = await createEntry(
    requireUserId(req),
    req.params.id as string,
    dayIndex,
    req.body as CreateEntryInput
  );
  sendSuccess(res, page, 201);
});

export const patchEntry = asyncHandler(async (req: Request, res: Response) => {
  const dayIndex = dayIndexParamSchema.parse(req.params.dayIndex);
  const page = await updateEntry(
    requireUserId(req),
    req.params.id as string,
    dayIndex,
    req.params.entryId as string,
    req.body as UpdateEntryInput
  );
  sendSuccess(res, page);
});

export const removeEntry = asyncHandler(async (req: Request, res: Response) => {
  const dayIndex = dayIndexParamSchema.parse(req.params.dayIndex);
  const page = await deleteEntry(
    requireUserId(req),
    req.params.id as string,
    dayIndex,
    req.params.entryId as string
  );
  sendSuccess(res, page);
});
