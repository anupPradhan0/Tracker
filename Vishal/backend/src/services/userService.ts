import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import type { SafeUser } from "../types/api.js";
import { ApiError } from "../utils/ApiError.js";

function toSafeUser(user: {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

export async function createUser(data: {
  name: string;
  email: string;
  passwordHash: string;
}): Promise<SafeUser> {
  try {
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        password: data.passwordHash,
      },
    });
    return toSafeUser(user);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ApiError(409, "USER_EXISTS", "User already exists");
    }
    throw error;
  }
}

export async function findByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
}

export async function findUserById(id: string): Promise<SafeUser | null> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return null;
  return toSafeUser(user);
}

export { toSafeUser };
