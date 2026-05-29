import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../../infrastructure/prisma/client.js";
import { env } from "../../config/env.js";
import { AppError } from "../../common/errors/app-error.js";
import type { AuthPayload } from "../../common/middleware/auth.js";
import { DEFAULT_CATEGORIES } from "../../common/constants/default-categories.js";
import { toUserPublic } from "../../common/utils/user-mapper.js";

const BCRYPT_ROUNDS = 12;

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

export class AuthService {
  async register(email: string, password: string, name: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw AppError.conflict("Email already registered");

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { email, passwordHash, name },
      });

      await tx.category.createMany({
        data: DEFAULT_CATEGORIES.map((c) => ({
          userId: created.id,
          name: c.name,
          icon: c.icon,
          color: c.color,
          isDefault: true,
        })),
        skipDuplicates: true,
      });

      return created;
    });

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
