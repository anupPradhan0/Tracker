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
import { getUsersForWeeklyCron } from "../services/weeklyReportService.js";
import { generateWeeklyAnalysisForEmail } from "../services/aiSummaryService.js";
import { generateWeeklyPdf } from "../services/pdfService.js";
import { calculatePageTotal, getWeeklyBudget, parseFixedExpenses } from "../utils/tracker.js";
import type { TrackerPageDto } from "../types/tracker.js";

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

function mapUserPage(
  page: NonNullable<Awaited<ReturnType<typeof getUsersForWeeklyCron>>[0]["trackerPages"][0]>
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
      const settings = user.settings!;
      const page = mapUserPage(pageRecord);
      const fixedExpenses = parseFixedExpenses(settings.fixedExpenses);
      const weeklyBudget = getWeeklyBudget(settings.monthlyBudget, fixedExpenses);
      const difference = weeklyBudget > 0 ? page.pageTotal - weeklyBudget : 0;

      const data = {
        userName: user.name,
        currency: settings.currency,
        monthlyBudget: settings.monthlyBudget,
        weeklyBudget,
        weekTotal: page.pageTotal,
        difference,
        isOverBudget: weeklyBudget > 0 && difference > 0,
        pageTitle: page.title,
        analysis: await generateWeeklyAnalysisForEmail(
          user.id,
          page,
          settings.currency,
          settings.monthlyBudget,
          fixedExpenses
        ),
      };

      const pdfBuffer = generateWeeklyPdf(page, settings.currency, user.name);
      const filename = `${page.title.replace(/[^a-z0-9]/gi, "_")}_weekly_report.pdf`;

      await sendWeeklyReportEmail(user.email, data, { filename, content: pdfBuffer });
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
