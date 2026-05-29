import type { Request, Response, NextFunction } from "express";
import { usersService } from "./users.service.js";
import { sendSuccess } from "../../common/utils/response.js";
import { toUserPublic } from "../../common/utils/user-mapper.js";
import type { AiProvider } from "@prisma/client";

export class UsersController {
  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await usersService.updateProfile(req.user!.userId, req.body);
      sendSuccess(res, toUserPublic(user));
    } catch (e) {
      next(e);
    }
  };

  aiKeyStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = await usersService.getAiKeyStatus(req.user!.userId);
      sendSuccess(res, status);
    } catch (e) {
      next(e);
    }
  };

  upsertAiKey = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const provider = req.params.provider as AiProvider;
      const result = await usersService.upsertAiKey(
        req.user!.userId,
        provider,
        req.body.apiKey
      );
      sendSuccess(res, result);
    } catch (e) {
      next(e);
    }
  };

  deleteAiKey = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await usersService.deleteAiKey(req.user!.userId, req.params.provider as AiProvider);
      sendSuccess(res, { deleted: true });
    } catch (e) {
      next(e);
    }
  };

  getEmailSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const settings = await usersService.getEmailSettings(req.user!.userId);
      sendSuccess(res, settings);
    } catch (e) {
      next(e);
    }
  };

  updateEmailSettings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const settings = await usersService.updateEmailSettings(req.user!.userId, req.body);
      sendSuccess(res, settings);
    } catch (e) {
      next(e);
    }
  };
}

export const usersController = new UsersController();
