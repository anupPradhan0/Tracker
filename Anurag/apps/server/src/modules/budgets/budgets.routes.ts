import { Router } from "express";
import { upsertBudgetSchema, budgetParamsSchema } from "@anurag/types";
import { validate } from "../../common/middleware/validate.js";
import { authenticate } from "../../common/middleware/auth.js";
import { budgetsController } from "./budgets.controller.js";
import { z } from "zod";

const yearMonthParams = budgetParamsSchema.extend({
  year: z.coerce.number(),
  month: z.coerce.number(),
});

export const budgetsRoutes = Router();

budgetsRoutes.use(authenticate);
budgetsRoutes.get("/current", budgetsController.getCurrent);
budgetsRoutes.get(
  "/:year/:month",
  validate(yearMonthParams, "params"),
  budgetsController.getForMonth
);
budgetsRoutes.put(
  "/:year/:month",
  validate(yearMonthParams, "params"),
  validate(upsertBudgetSchema),
  budgetsController.upsert
);
