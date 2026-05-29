import { Router } from "express";
import { createCategorySchema, updateCategorySchema } from "@anurag/types";
import { validate } from "../../common/middleware/validate.js";
import { authenticate } from "../../common/middleware/auth.js";
import { categoriesController } from "./categories.controller.js";

export const categoriesRoutes = Router();

categoriesRoutes.use(authenticate);
categoriesRoutes.get("/", categoriesController.list);
categoriesRoutes.post("/", validate(createCategorySchema), categoriesController.create);
categoriesRoutes.patch("/:id", validate(updateCategorySchema), categoriesController.update);
categoriesRoutes.delete("/:id", categoriesController.delete);
