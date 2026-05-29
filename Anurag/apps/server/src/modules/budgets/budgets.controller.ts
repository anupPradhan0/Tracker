import type { Request, Response, NextFunction } from "express";
import { budgetsService } from "./budgets.service.js";
import { sendSuccess } from "../../common/utils/response.js";

export class BudgetsController {
  getCurrent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const budget = await budgetsService.getCurrent(req.user!.userId);
      sendSuccess(res, budget);
    } catch (e) {
      next(e);
    }
  };

  getForMonth = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { year, month } = req.params as { year: string; month: string };
      const budget = await budgetsService.getForMonth(
        req.user!.userId,
        parseInt(year, 10),
        parseInt(month, 10)
      );
      sendSuccess(res, budget);
    } catch (e) {
      next(e);
    }
  };

  upsert = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { year, month } = req.params as { year: string; month: string };
      const budget = await budgetsService.upsert(
        req.user!.userId,
        parseInt(year, 10),
        parseInt(month, 10),
        req.body.amount,
        req.body.currency
      );
      sendSuccess(res, budget);
    } catch (e) {
      next(e);
    }
  };
}

export const budgetsController = new BudgetsController();
