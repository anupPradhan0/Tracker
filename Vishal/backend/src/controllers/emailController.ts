import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { isEmailConfigured, sendWeeklyReportEmail } from "../services/emailService.js";
import { buildWeeklyEmailData } from "../services/weeklyReportService.js";
import { generateWeeklyPdf } from "../services/pdfService.js";
import { getOrCreateDefaultPage } from "../services/trackerService.js";

export const sendWeeklyEmail = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  }

  if (!isEmailConfigured()) {
    throw new ApiError(
      503,
      "EMAIL_NOT_CONFIGURED",
      "Email service is not configured on the server"
    );
  }

  const body = req.body as { pageId?: string };
  let pageId = body.pageId;

  if (!pageId) {
    const defaultPage = await getOrCreateDefaultPage(req.user.id);
    pageId = defaultPage.id;
  }

  const { email, data, page } = await buildWeeklyEmailData(req.user.id, pageId);
  const pdfBuffer = generateWeeklyPdf(page, data.currency, data.userName);
  const filename = `${page.title.replace(/[^a-z0-9]/gi, "_")}_weekly_report.pdf`;

  await sendWeeklyReportEmail(email, data, { filename, content: pdfBuffer });

  sendSuccess(res, { sent: true, to: email });
});

export const emailStatus = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, { configured: isEmailConfigured() });
});
