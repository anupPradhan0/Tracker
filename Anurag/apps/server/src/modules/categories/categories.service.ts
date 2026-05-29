import { prisma } from "../../infrastructure/prisma/client.js";
import { AppError } from "../../common/errors/app-error.js";

export class CategoriesService {
  async list(userId: string) {
    return prisma.category.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });
  }

  async create(userId: string, data: { name: string; icon?: string; color?: string }) {
    try {
      return await prisma.category.create({
        data: { userId, ...data, isDefault: false },
      });
    } catch {
      throw AppError.conflict("Category already exists");
    }
  }

  async update(userId: string, id: string, data: { name?: string; icon?: string; color?: string }) {
    const cat = await prisma.category.findFirst({ where: { id, userId } });
    if (!cat) throw AppError.notFound("Category not found");
    return prisma.category.update({ where: { id }, data });
  }

  async delete(userId: string, id: string) {
    const cat = await prisma.category.findFirst({ where: { id, userId } });
    if (!cat) throw AppError.notFound("Category not found");
    const count = await prisma.expense.count({ where: { categoryId: id } });
    if (count > 0) throw AppError.badRequest("Cannot delete category with expenses");
    await prisma.category.delete({ where: { id } });
  }
}

export const categoriesService = new CategoriesService();
