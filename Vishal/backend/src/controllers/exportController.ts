import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {
  buildWeeklyReportPackage,
  buildWeeklyPdfBuffer,
} from "../services/weeklyReportService.js";

export const exportPdf = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  }

  const { pageId } = req.body as { pageId: string };
  const pkg = await buildWeeklyReportPackage(req.user.id, pageId);
  const { buffer, filename } = buildWeeklyPdfBuffer(pkg);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(buffer);
});
