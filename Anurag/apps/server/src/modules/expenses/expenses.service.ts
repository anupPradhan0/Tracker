import { Prisma } from "@prisma/client";
import { prisma } from "../../infrastructure/prisma/client.js";
import { AppError } from "../../common/errors/app-error.js";
import { getPaginationSkip, getTotalPages } from "@anurag/utils";
import type { ExpenseQueryInput } from "@anurag/types";

function mapExpense(e: {
  id: string;
  amount: Prisma.Decimal;
  description: string | null;
  date: Date;
  currency: string;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
  category?: { id: string; name: string; icon: string | null; color: string | null; isDefault: boolean };
}) {
  return {
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
  };
}

export class ExpensesService {
  async list(userId: string, query: ExpenseQueryInput) {
    const { page, limit, search, categoryId, from, to, sort } = query;
    const where: Prisma.ExpenseWhereInput = { userId };

    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [{ description: { contains: search, mode: "insensitive" } }];
    }
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    const orderBy: Prisma.ExpenseOrderByWithRelationInput =
      sort === "date_asc"
        ? { date: "asc" }
        : sort === "amount_desc"
          ? { amount: "desc" }
          : sort === "amount_asc"
            ? { amount: "asc" }
            : { date: "desc" };

    const [total, items] = await Promise.all([
      prisma.expense.count({ where }),
      prisma.expense.findMany({
        where,
        include: { category: true },
        orderBy,
        skip: getPaginationSkip({ page, limit }),
        take: limit,
      }),
    ]);

    return {
      items: items.map(mapExpense),
      meta: { page, limit, total, totalPages: getTotalPages(total, limit) },
    };
  }

  async getById(userId: string, id: string) {
    const expense = await prisma.expense.findFirst({
      where: { id, userId },
      include: { category: true },
    });
    if (!expense) throw AppError.notFound("Expense not found");
    return mapExpense(expense);
  }

  async create(
    userId: string,
    data: { amount: number; description?: string; date: string; categoryId: string; currency?: string }
  ) {
    const category = await prisma.category.findFirst({
      where: { id: data.categoryId, userId },
    });
    if (!category) throw AppError.badRequest("Invalid category");

    const expense = await prisma.expense.create({
      data: {
        userId,
        categoryId: data.categoryId,
        amount: data.amount,
        description: data.description,
        date: new Date(data.date),
        currency: data.currency ?? "INR",
      },
      include: { category: true },
    });
    return mapExpense(expense);
  }

  async update(
    userId: string,
    id: string,
    data: Partial<{ amount: number; description?: string; date: string; categoryId: string; currency?: string }>
  ) {
    const existing = await prisma.expense.findFirst({ where: { id, userId } });
    if (!existing) throw AppError.notFound("Expense not found");

    if (data.categoryId) {
      const category = await prisma.category.findFirst({
        where: { id: data.categoryId, userId },
      });
      if (!category) throw AppError.badRequest("Invalid category");
    }

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.date && { date: new Date(data.date) }),
        ...(data.categoryId && { categoryId: data.categoryId }),
        ...(data.currency && { currency: data.currency }),
      },
      include: { category: true },
    });
    return mapExpense(expense);
  }

  async delete(userId: string, id: string) {
    const existing = await prisma.expense.findFirst({ where: { id, userId } });
    if (!existing) throw AppError.notFound("Expense not found");
    await prisma.expense.delete({ where: { id } });
  }

  async sumInRange(userId: string, start: Date, end: Date) {
    const result = await prisma.expense.aggregate({
      where: { userId, date: { gte: start, lte: end } },
      _sum: { amount: true },
    });
    return result._sum.amount?.toString() ?? "0";
  }
}

export const expensesService = new ExpensesService();
