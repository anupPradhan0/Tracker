import { prisma } from "../../infrastructure/prisma/client.js";
import { expensesService } from "../expenses/expenses.service.js";
import { getMonthRange } from "@anurag/utils";

export class BudgetsService {
  async getForMonth(userId: string, year: number, month: number) {
    const budget = await prisma.budget.findUnique({
      where: { userId_year_month: { userId, year, month } },
    });

    const { start, end } = getMonthRange(year, month);
    const spent = await expensesService.sumInRange(userId, start, end);
    const amount = budget?.amount.toString() ?? null;
    const remaining =
      amount !== null ? (parseFloat(amount) - parseFloat(spent)).toFixed(2) : null;

    return {
      id: budget?.id ?? null,
      year,
      month,
      amount: amount ?? "0",
      currency: budget?.currency ?? "INR",
      spent,
      remaining,
      exceeded: amount !== null && parseFloat(spent) > parseFloat(amount),
    };
  }

  async upsert(userId: string, year: number, month: number, amount: number, currency?: string) {
    await prisma.budget.upsert({
      where: { userId_year_month: { userId, year, month } },
      create: { userId, year, month, amount, currency: currency ?? "INR" },
      update: { amount, ...(currency && { currency }) },
    });
    return this.getForMonth(userId, year, month);
  }

  async getCurrent(userId: string) {
    const now = new Date();
    return this.getForMonth(userId, now.getFullYear(), now.getMonth() + 1);
  }
}

export const budgetsService = new BudgetsService();
