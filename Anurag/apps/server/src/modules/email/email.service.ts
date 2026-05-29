import type { SummaryPeriod } from "@prisma/client";
import { getMonthRange, getWeekRange } from "@anurag/utils";
import { prisma } from "../../infrastructure/prisma/client.js";
import { aiService } from "../ai/ai.service.js";
import { expensesService } from "../expenses/expenses.service.js";
import { mailService } from "../../infrastructure/mail/mail.service.js";
import { buildAiSummaryEmail } from "../../infrastructure/mail/templates/ai-summary.html.js";
import { AppError } from "../../common/errors/app-error.js";

function getPeriodRange(period: SummaryPeriod, now = new Date()) {
  if (period === "MONTHLY") {
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const range = getMonthRange(year, month);
    return {
      periodStart: range.start,
      periodEnd: range.end,
      periodLabel: `Monthly (${now.toLocaleString("en-US", { month: "long", year: "numeric" })})`,
    };
  }
  const range = getWeekRange(now);
  return {
    periodStart: range.start,
    periodEnd: range.end,
    periodLabel: "Weekly",
  };
}

export class EmailService {
  async sendAiSummary(userId: string, period: SummaryPeriod = "MONTHLY") {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.notFound();

    const recipient = user.reportReceiverEmail;
    if (!recipient) {
      throw AppError.badRequest(
        "Receiver email is not configured. Add it in Settings → Email."
      );
    }

    const { periodStart, periodEnd, periodLabel } = getPeriodRange(period);

    const log = await prisma.emailLog.create({
      data: {
        userId,
        type: "AI_SUMMARY",
        status: "PENDING",
        recipient,
        metadata: { period, periodStart: periodStart.toISOString(), periodEnd: periodEnd.toISOString() },
      },
    });

    try {
      const [result, expenses] = await Promise.all([
        aiService.generateSummary(userId, period),
        expensesService.listInRange(userId, periodStart, periodEnd),
      ]);

      const { dashboardSummary: summary, ...insight } = result;
      const totalSpent = period === "MONTHLY" ? summary.monthlyTotal : summary.weeklyTotal;

      const html = buildAiSummaryEmail(user.name, periodLabel, insight, {
        totalSpent,
        currency: user.currency,
        budgetExceeded: summary.budgetExceeded,
        budgetAmount: summary.budgetAmount,
        remainingBudget: summary.remainingBudget,
        topCategories: summary.topCategories,
        expenses,
      });

      const from = user.reportSenderEmail
        ? `"${user.name}" <${user.reportSenderEmail}>`
        : undefined;

      await mailService.sendHtml(
        recipient,
        `Your ${periodLabel} Expense Report`,
        html,
        from
      );

      await prisma.emailLog.update({
        where: { id: log.id },
        data: { status: "SENT", sentAt: new Date() },
      });

      return { sent: true, email: recipient };
    } catch (error) {
      await prisma.emailLog.update({
        where: { id: log.id },
        data: {
          status: "FAILED",
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });
      throw error;
    }
  }

  async getRecentLogs(userId: string, limit = 5) {
    return prisma.emailLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        type: true,
        status: true,
        recipient: true,
        error: true,
        sentAt: true,
        createdAt: true,
      },
    });
  }
}

export const emailService = new EmailService();
