import { prisma } from "../../infrastructure/prisma/client.js";
import { getMonthRange, getWeekRange } from "@anurag/utils";
import { expensesService } from "../expenses/expenses.service.js";
import { budgetsService } from "../budgets/budgets.service.js";

export class AnalyticsService {
  async getSummary(userId: string) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const monthRange = getMonthRange(year, month);
    const weekRange = getWeekRange(now);

    const [monthlyTotal, weeklyTotal, budget, recentResult, categoryBreakdown] =
      await Promise.all([
        expensesService.sumInRange(userId, monthRange.start, monthRange.end),
        expensesService.sumInRange(userId, weekRange.start, weekRange.end),
        budgetsService.getCurrent(userId),
        prisma.expense.findMany({
          where: { userId },
          include: { category: true },
          orderBy: { date: "desc" },
          take: 5,
        }),
        prisma.expense.groupBy({
          by: ["categoryId"],
          where: {
            userId,
            date: { gte: monthRange.start, lte: monthRange.end },
          },
          _sum: { amount: true },
          orderBy: { _sum: { amount: "desc" } },
          take: 5,
        }),
      ]);

    const categoryIds = categoryBreakdown.map((c) => c.categoryId);
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
    });

    const topCategories = categoryBreakdown.map((row) => {
      const cat = categories.find((c) => c.id === row.categoryId);
      return {
        categoryId: row.categoryId,
        name: cat?.name ?? "Unknown",
        total: row._sum.amount?.toString() ?? "0",
        color: cat?.color ?? null,
      };
    });

    return {
      monthlyTotal,
      weeklyTotal,
      budgetAmount: budget.amount !== "0" ? budget.amount : null,
      remainingBudget: budget.remaining,
      budgetExceeded: budget.exceeded,
      topCategories,
      recentExpenses: recentResult.map((e) => ({
        id: e.id,
        amount: e.amount.toString(),
        description: e.description,
        date: e.date.toISOString(),
        currency: e.currency,
        categoryId: e.categoryId,
        category: e.category
          ? {
              id: e.category.id,
              name: e.category.name,
              icon: e.category.icon,
              color: e.category.color,
              isDefault: e.category.isDefault,
            }
          : undefined,
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
      })),
    };
  }

  async getTrends(userId: string, months = 6) {
    const now = new Date();
    const trends: { label: string; total: string }[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const { start, end } = getMonthRange(year, month);
      const total = await expensesService.sumInRange(userId, start, end);
      trends.push({
        label: d.toLocaleString("en-US", { month: "short", year: "2-digit" }),
        total,
      });
    }

    return trends;
  }

  async getByCategory(userId: string, year?: number, month?: number) {
    const now = new Date();
    const y = year ?? now.getFullYear();
    const m = month ?? now.getMonth() + 1;
    const { start, end } = getMonthRange(y, m);

    const grouped = await prisma.expense.groupBy({
      by: ["categoryId"],
      where: { userId, date: { gte: start, lte: end } },
      _sum: { amount: true },
    });

    const categories = await prisma.category.findMany({
      where: { userId, id: { in: grouped.map((g) => g.categoryId) } },
    });

    return grouped.map((row) => {
      const cat = categories.find((c) => c.id === row.categoryId);
      return {
        categoryId: row.categoryId,
        name: cat?.name ?? "Unknown",
        total: row._sum.amount?.toString() ?? "0",
        color: cat?.color ?? null,
      };
    });
  }
}

export const analyticsService = new AnalyticsService();
