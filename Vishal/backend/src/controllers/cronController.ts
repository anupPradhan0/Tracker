import type { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";
import {
  getEmailSetupHint,
  isEmailConfigured,
  sendWeeklyReportEmail,
} from "../services/emailService.js";
import {
  buildWeeklyReportPackage,
  buildWeeklyPdfBuffer,
  getUsersForWeeklyCron,
} from "../services/weeklyReportService.js";

function verifyCronAuth(req: Request) {
  if (!env.CRON_SECRET) {
    throw new ApiError(
      503,
      "CRON_NOT_CONFIGURED",
      "CRON_SECRET must be set to use cron endpoints"
    );
  }

  const auth = req.headers.authorization;
  if (auth !== `Bearer ${env.CRON_SECRET}`) {
    throw new ApiError(401, "UNAUTHORIZED", "Invalid cron secret");
  }
}

export const runWeeklyEmailCron = asyncHandler(async (req: Request, res: Response) => {
  verifyCronAuth(req);

  if (!isEmailConfigured()) {
    throw new ApiError(
      503,
      "EMAIL_NOT_CONFIGURED",
      getEmailSetupHint() ??
        "Set MAIL_HOST, MAIL_USER, and MAIL_PASSWORD in backend/.env, then restart the backend server."
    );
  }

  const users = await getUsersForWeeklyCron();
  const results = { total: users.length, success: 0, failed: 0, errors: [] as string[] };

  for (const user of users) {
    const pageRecord = user.trackerPages[0];
    if (!pageRecord) continue;

    try {
      const pkg = await buildWeeklyReportPackage(user.id, pageRecord.id);
      const { buffer, filename } = buildWeeklyPdfBuffer(pkg);

      await sendWeeklyReportEmail(pkg.email, pkg.data, { filename, content: buffer });
      results.success++;
    } catch (err) {
      results.failed++;
      results.errors.push(
        `${user.email}: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  }

  sendSuccess(res, { message: "Weekly email cron completed", results });
});
