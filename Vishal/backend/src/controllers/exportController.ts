import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { getPageForExport } from "../services/trackerService.js";
import { generateWeeklyPdf } from "../services/pdfService.js";
import { calculatePageTotal } from "../utils/tracker.js";
import type { TrackerPageDto } from "../types/tracker.js";

function toPageDto(
  page: Awaited<ReturnType<typeof getPageForExport>>["page"]
): TrackerPageDto {
  const days = page.days.map((day) => ({
    id: day.id,
    dayIndex: day.dayIndex,
    entries: day.entries.map((e) => ({
      id: e.id,
      title: e.title,
      amount: e.amount,
      description: e.description,
      category: e.category,
      tags: e.tags,
      sortOrder: e.sortOrder,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
    })),
  }));

  return {
    id: page.id,
    title: page.title,
    icon: page.icon,
    days,
    pageTotal: calculatePageTotal(days),
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
  };
}

export const exportPdf = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  }

  const { pageId } = req.body as { pageId: string };
  const { page, settings, userName } = await getPageForExport(req.user.id, pageId);
  const pageDto = toPageDto(page);
  const buffer = generateWeeklyPdf(pageDto, settings.currency, userName);

  const filename = `${page.title.replace(/[^a-z0-9]/gi, "_")}_weekly_report.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(buffer);
});
