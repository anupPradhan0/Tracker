import { prisma } from "../../infrastructure/prisma/client.js";
import { aiService } from "../ai/ai.service.js";
import { mailService } from "../../infrastructure/mail/mail.service.js";
import { buildAiSummaryEmail } from "../../infrastructure/mail/templates/ai-summary.html.js";
import { AppError } from "../../common/errors/app-error.js";
import type { SummaryPeriod } from "@prisma/client";

export class EmailService {
  async sendAiSummary(userId: string, period: SummaryPeriod = "MONTHLY") {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.notFound();

    const log = await prisma.emailLog.create({
      data: {
        userId,
        type: "AI_SUMMARY",
        status: "PENDING",
        recipient: user.email,
        metadata: { period },
      },
    });

    try {
      const result = await aiService.generateSummary(userId, period);
      const { dashboardSummary: summary, ...insight } = result;
      const periodLabel = period === "MONTHLY" ? "Monthly" : "Weekly";
      const totalSpent = period === "MONTHLY" ? summary.monthlyTotal : summary.weeklyTotal;

      const html = buildAiSummaryEmail(user.name, periodLabel, insight, {
        totalSpent,
        currency: user.currency,
        budgetExceeded: summary.budgetExceeded,
      });

      await mailService.sendHtml(
        user.email,
        `Your ${periodLabel} Expense Summary`,
        html
      );

      await prisma.emailLog.update({
        where: { id: log.id },
        data: { status: "SENT", sentAt: new Date() },
      });

      return { sent: true, email: user.email };
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
