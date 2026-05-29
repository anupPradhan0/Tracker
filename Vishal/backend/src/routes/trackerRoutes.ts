import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.middleware.js";
import {
  createEntrySchema,
  createPageSchema,
  exportPdfSchema,
  sendEmailSchema,
  updateEntrySchema,
  updatePageSchema,
  updateSettingsSchema,
} from "../validators/tracker.validator.js";
import {
  getDefaultPage,
  getPageById,
  getPages,
  getSettings,
  patchEntry,
  patchPage,
  patchSettings,
  postEntry,
  postPage,
  removeEntry,
  removePage,
} from "../controllers/trackerController.js";
import {
  getFolders,
  patchFolder,
  postFolder,
  removeFolder,
} from "../controllers/folderController.js";
import { createFolderSchema, updateFolderSchema } from "../validators/folder.validator.js";
import { exportPdf } from "../controllers/exportController.js";
import { emailStatus, sendWeeklyEmail } from "../controllers/emailController.js";

const router = Router();

router.use(authMiddleware);

router.get("/settings", getSettings);
router.patch("/settings", validateBody(updateSettingsSchema), patchSettings);

router.get("/folders", getFolders);
router.post("/folders", validateBody(createFolderSchema), postFolder);
router.patch("/folders/:id", validateBody(updateFolderSchema), patchFolder);
router.delete("/folders/:id", removeFolder);

router.get("/pages", getPages);
router.get("/pages/default", getDefaultPage);
router.get("/pages/:id", getPageById);
router.post("/pages", validateBody(createPageSchema), postPage);
router.patch("/pages/:id", validateBody(updatePageSchema), patchPage);
router.delete("/pages/:id", removePage);

router.post(
  "/pages/:id/days/:dayIndex/entries",
  validateBody(createEntrySchema),
  postEntry
);
router.patch(
  "/pages/:id/days/:dayIndex/entries/:entryId",
  validateBody(updateEntrySchema),
  patchEntry
);
router.delete("/pages/:id/days/:dayIndex/entries/:entryId", removeEntry);

router.post("/export/pdf", validateBody(exportPdfSchema), exportPdf);

router.get("/email/status", emailStatus);
router.post("/email/send", validateBody(sendEmailSchema), sendWeeklyEmail);

export default router;
