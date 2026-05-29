import type { Request, Response, NextFunction } from "express";
import { usersService } from "./users.service.js";
import { sendSuccess } from "../../common/utils/response.js";
import type { AiProvider } from "@prisma/client";

export class UsersController {
  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await usersService.updateProfile(req.user!.userId, req.body);
      sendSuccess(res, {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        preferredAiProvider: user.preferredAiProvider,
        currency: user.currency,
        createdAt: user.createdAt.toISOString(),
      });
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
}

export const usersController = new UsersController();
