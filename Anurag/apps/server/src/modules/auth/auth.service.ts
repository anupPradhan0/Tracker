import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { User } from "@prisma/client";
import { prisma } from "../../infrastructure/prisma/client.js";
import { env } from "../../config/env.js";
import { AppError } from "../../common/errors/app-error.js";
import type { AuthPayload } from "../../common/middleware/auth.js";
import { DEFAULT_CATEGORIES } from "../../common/constants/default-categories.js";

const BCRYPT_ROUNDS = 12;

function toUserPublic(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    preferredAiProvider: user.preferredAiProvider,
    currency: user.currency,
    createdAt: user.createdAt.toISOString(),
  };
}

function signAccessToken(payload: AuthPayload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

function signRefreshToken(payload: AuthPayload) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

async function seedDefaultCategories(userId: string) {
  await prisma.category.createMany({
    data: DEFAULT_CATEGORIES.map((c) => ({
      userId,
      name: c.name,
      icon: c.icon,
      color: c.color,
      isDefault: true,
    })),
    skipDuplicates: true,
  });
}

export class AuthService {
  async register(email: string, password: string, name: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw AppError.conflict("Email already registered");

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await prisma.user.create({
      data: { email, passwordHash, name },
    });

    await seedDefaultCategories(user.id);

    const payload: AuthPayload = { userId: user.id, email: user.email, role: user.role };
    return {
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
      user: toUserPublic(user),
    };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw AppError.unauthorized("Invalid email or password");

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw AppError.unauthorized("Invalid email or password");

    const payload: AuthPayload = { userId: user.id, email: user.email, role: user.role };
    return {
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload),
      user: toUserPublic(user),
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as AuthPayload;
      const user = await prisma.user.findUnique({ where: { id: payload.userId } });
      if (!user) throw AppError.unauthorized();

      const newPayload: AuthPayload = { userId: user.id, email: user.email, role: user.role };
      return {
        accessToken: signAccessToken(newPayload),
        refreshToken: signRefreshToken(newPayload),
        user: toUserPublic(user),
      };
    } catch {
      throw AppError.unauthorized("Invalid refresh token");
    }
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.notFound("User not found");
    return toUserPublic(user);
  }
}

export const authService = new AuthService();
