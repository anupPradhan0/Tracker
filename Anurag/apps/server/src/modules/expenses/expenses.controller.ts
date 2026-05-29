import type { Request, Response, NextFunction } from "express";
import { expensesService } from "./expenses.service.js";
import { sendSuccess } from "../../common/utils/response.js";

export class ExpensesController {
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await expensesService.list(req.user!.userId, req.query as never);
      sendSuccess(res, result.items, 200, result.meta);
    } catch (e) {
      next(e);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const expense = await expensesService.getById(req.user!.userId, String(req.params.id));
      sendSuccess(res, expense);
    } catch (e) {
      next(e);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const expense = await expensesService.create(req.user!.userId, req.body);
      sendSuccess(res, expense, 201);
    } catch (e) {
      next(e);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const expense = await expensesService.update(req.user!.userId, String(req.params.id), req.body);
      sendSuccess(res, expense);
    } catch (e) {
      next(e);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await expensesService.delete(req.user!.userId, String(req.params.id));
      sendSuccess(res, { deleted: true });
    } catch (e) {
      next(e);
    }
  };
}

export const expensesController = new ExpensesController();
