import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import {
  formatSmtpError,
  getEmailSetupHint,
  getEmailStatus,
  isEmailConfigured,
  sendWeeklyReportEmail,
} from "../services/emailService.js";
import { buildWeeklyEmailData } from "../services/weeklyReportService.js";
import { generateWeeklyPdf } from "../services/pdfService.js";
import { getOrCreateDefaultPage } from "../services/trackerService.js";

export const sendWeeklyEmail = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  }

  const body = req.body as { pageId?: string };

  if (!isEmailConfigured()) {
    throw new ApiError(
      503,
      "EMAIL_NOT_CONFIGURED",
      getEmailSetupHint() ??
        "Set MAIL_HOST, MAIL_USER, and MAIL_PASSWORD in backend/.env, then restart the backend server."
    );
  }
  let pageId = body.pageId;

  if (!pageId) {
    const defaultPage = await getOrCreateDefaultPage(req.user.id);
    pageId = defaultPage.id;
  }

  const { email, data, page } = await buildWeeklyEmailData(req.user.id, pageId);
  const pdfBuffer = generateWeeklyPdf(page, data.currency, data.userName);
  const filename = `${page.title.replace(/[^a-z0-9]/gi, "_")}_weekly_report.pdf`;

  try {
    await sendWeeklyReportEmail(email, data, { filename, content: pdfBuffer });
  } catch (err) {
    throw new ApiError(502, "EMAIL_SEND_FAILED", formatSmtpError(err));
  }

  sendSuccess(res, { sent: true, to: email });
});

export const emailStatus = asyncHandler(async (_req: Request, res: Response) => {
  const status = getEmailStatus();
  sendSuccess(res, {
    configured: status.configured,
    ready: status.ready,
    canSend: status.ready,
  });
});
