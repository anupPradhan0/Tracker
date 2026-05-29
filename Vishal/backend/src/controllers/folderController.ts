import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import {
  createFolder,
  deleteFolder,
  listFolders,
  updateFolder,
} from "../services/folderService.js";
import type { CreateFolderInput, UpdateFolderInput } from "../validators/folder.validator.js";

function requireUserId(req: Request): string {
  if (!req.user?.id) {
    throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  }
  return req.user.id;
}

export const getFolders = asyncHandler(async (req: Request, res: Response) => {
  const folders = await listFolders(requireUserId(req));
  sendSuccess(res, folders);
});

export const postFolder = asyncHandler(async (req: Request, res: Response) => {
  const folder = await createFolder(requireUserId(req), req.body as CreateFolderInput);
  sendSuccess(res, folder, 201);
});

export const patchFolder = asyncHandler(async (req: Request, res: Response) => {
  const folder = await updateFolder(
    requireUserId(req),
    req.params.id as string,
    req.body as UpdateFolderInput
  );
  sendSuccess(res, folder);
});

export const removeFolder = asyncHandler(async (req: Request, res: Response) => {
  await deleteFolder(requireUserId(req), req.params.id as string);
  sendSuccess(res, { deleted: true });
});
