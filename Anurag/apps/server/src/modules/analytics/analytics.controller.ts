import type { Request, Response, NextFunction } from "express";
import { analyticsService } from "./analytics.service.js";
import { sendSuccess } from "../../common/utils/response.js";

export class AnalyticsController {
  summary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await analyticsService.getSummary(req.user!.userId);
      sendSuccess(res, data);
    } catch (e) {
      next(e);
    }
  };

  trends = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const months = parseInt((req.query.months as string) || "6", 10);
      const data = await analyticsService.getTrends(req.user!.userId, months);
      sendSuccess(res, data);
    } catch (e) {
      next(e);
    }
  };

  byCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
      const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
      const data = await analyticsService.getByCategory(req.user!.userId, year, month);
      sendSuccess(res, data);
    } catch (e) {
      next(e);
    }
  };
}

export const analyticsController = new AnalyticsController();
