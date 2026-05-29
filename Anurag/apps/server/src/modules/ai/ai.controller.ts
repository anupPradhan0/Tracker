import type { Request, Response, NextFunction } from "express";
import { aiService } from "./ai.service.js";
import { sendSuccess } from "../../common/utils/response.js";

export class AiController {
  generate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { period } = req.body;
      const result = await aiService.generateSummary(req.user!.userId, period);
      sendSuccess(res, result);
    } catch (e) {
      next(e);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await aiService.listSummaries(req.user!.userId);
      sendSuccess(res, items);
    } catch (e) {
      next(e);
    }
  };
}

export const aiController = new AiController();
