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
  verifySmtpConnection,
} from "../services/emailService.js";
import {
  buildWeeklyReportPackage,
  buildWeeklyPdfBuffer,
} from "../services/weeklyReportService.js";
import { getOrCreateDefaultPage } from "../services/trackerService.js";

export const sendWeeklyEmail = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  }

  const body = req.body as { pageId?: string };

  let pageId = body.pageId;

  if (!pageId) {
    const defaultPage = await getOrCreateDefaultPage(req.user.id);
    pageId = defaultPage.id;
  }

  const pkg = await buildWeeklyReportPackage(req.user.id, pageId);
  const { buffer, filename } = buildWeeklyPdfBuffer(pkg);

  try {
    await sendWeeklyReportEmail(pkg.email, pkg.data, { filename, content: buffer });
  } catch (err) {
    if (!isEmailConfigured()) {
      throw new ApiError(
        503,
        "EMAIL_NOT_CONFIGURED",
        getEmailSetupHint() ??
          "Set MAIL_HOST, MAIL_USER, and MAIL_PASSWORD in backend/.env, then restart the backend server."
      );
    }
    throw new ApiError(502, "EMAIL_SEND_FAILED", formatSmtpError(err));
  }

  sendSuccess(res, { sent: true, to: pkg.email });
});

export const emailStatus = asyncHandler(async (_req: Request, res: Response) => {
  const status = getEmailStatus();
  const verify = await verifySmtpConnection();
  const hint = verify.hint ?? getEmailSetupHint();

  sendSuccess(res, {
    configured: status.configured,
    ready: status.ready && verify.ready,
    canSend: status.ready,
    ...(hint ? { hint } : {}),
  });
});
