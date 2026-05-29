import type { Request, Response, NextFunction } from "express";
import { categoriesService } from "./categories.service.js";
import { sendSuccess } from "../../common/utils/response.js";

function mapCategory(c: {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  isDefault: boolean;
}) {
  return { id: c.id, name: c.name, icon: c.icon, color: c.color, isDefault: c.isDefault };
}

export class CategoriesController {
  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await categoriesService.list(req.user!.userId);
      sendSuccess(res, items.map(mapCategory));
    } catch (e) {
      next(e);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cat = await categoriesService.create(req.user!.userId, req.body);
      sendSuccess(res, mapCategory(cat), 201);
    } catch (e) {
      next(e);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cat = await categoriesService.update(req.user!.userId, String(req.params.id), req.body);
      sendSuccess(res, mapCategory(cat));
    } catch (e) {
      next(e);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await categoriesService.delete(req.user!.userId, String(req.params.id));
      sendSuccess(res, { deleted: true });
    } catch (e) {
      next(e);
    }
  };
}

export const categoriesController = new CategoriesController();
