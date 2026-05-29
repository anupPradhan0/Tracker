import { Router } from "express";
import {
  createExpenseSchema,
  updateExpenseSchema,
  expenseQuerySchema,
} from "@anurag/types";
import { validate } from "../../common/middleware/validate.js";
import { authenticate } from "../../common/middleware/auth.js";
import { expensesController } from "./expenses.controller.js";

export const expensesRoutes = Router();

expensesRoutes.use(authenticate);
expensesRoutes.get("/", validate(expenseQuerySchema, "query"), expensesController.list);
expensesRoutes.get("/:id", expensesController.getById);
expensesRoutes.post("/", validate(createExpenseSchema), expensesController.create);
expensesRoutes.patch("/:id", validate(updateExpenseSchema), expensesController.update);
expensesRoutes.delete("/:id", expensesController.delete);
