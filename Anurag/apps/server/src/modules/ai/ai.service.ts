import type { SummaryPeriod } from "@prisma/client";
import { prisma } from "../../infrastructure/prisma/client.js";
import { usersService } from "../users/users.service.js";
import { analyticsService } from "../analytics/analytics.service.js";
import { expensesService } from "../expenses/expenses.service.js";
import { getMonthRange, getWeekRange } from "@anurag/utils";
import { buildSpendingPrompt, SYSTEM_PROMPT } from "../../infrastructure/ai/prompt.builder.js";
import { createAIProvider, withRetry } from "../../infrastructure/ai/provider.factory.js";
import { AppError } from "../../common/errors/app-error.js";
import type { AnalyticsSummary } from "@anurag/types";

export class AiService {
  async generateSummary(userId: string, period: SummaryPeriod) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.notFound();

    const apiKey = await usersService.getDecryptedAiKey(userId, user.preferredAiProvider);
    const provider = createAIProvider(user.preferredAiProvider, apiKey);

    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date;
    let totalSpent: string;
    let periodLabel: string;

    if (period === "MONTHLY") {
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const range = getMonthRange(year, month);
      periodStart = range.start;
      periodEnd = range.end;
      totalSpent = await expensesService.sumInRange(userId, periodStart, periodEnd);
      periodLabel = `month of ${now.toLocaleString("en-US", { month: "long", year: "numeric" })}`;
    } else {
      const range = getWeekRange(now);
      periodStart = range.start;
      periodEnd = range.end;
      totalSpent = await expensesService.sumInRange(userId, periodStart, periodEnd);
      periodLabel = "this week";
    }

    const summary = await analyticsService.getSummary(userId);
    const userPrompt = buildSpendingPrompt({
      period: periodLabel,
      totalSpent,
      currency: user.currency,
      topCategories: summary.topCategories.map((c) => ({ name: c.name, total: c.total })),
      budgetAmount: summary.budgetAmount,
      budgetExceeded: summary.budgetExceeded,
    });

    const insight = await withRetry(() =>
      provider.generateInsight(SYSTEM_PROMPT, userPrompt)
    );

    const saved = await prisma.aiSummary.create({
      data: {
        userId,
        period,
        periodStart,
        periodEnd,
        provider: user.preferredAiProvider,
        content: insight as object,
      },
    });

    return {
      ...insight,
      id: saved.id,
      createdAt: saved.createdAt.toISOString(),
      dashboardSummary: summary as AnalyticsSummary,
    };
  }

  async listSummaries(userId: string, limit = 10) {
    const items = await prisma.aiSummary.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return items.map((s) => ({
      id: s.id,
      period: s.period,
      periodStart: s.periodStart.toISOString(),
      periodEnd: s.periodEnd.toISOString(),
      provider: s.provider,
      content: s.content,
      createdAt: s.createdAt.toISOString(),
    }));
  }
}

export const aiService = new AiService();
