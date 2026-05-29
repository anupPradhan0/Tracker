import { prisma } from "../../infrastructure/prisma/client.js";
import { env } from "../../config/env.js";
import { AppError } from "../../common/errors/app-error.js";
import { encrypt, decrypt, getKeyHint } from "../../common/utils/crypto.js";
import type { AiProvider } from "@prisma/client";

export class UsersService {
  async updateProfile(
    userId: string,
    data: { name?: string; currency?: string; preferredAiProvider?: AiProvider }
  ) {
    return prisma.user.update({ where: { id: userId }, data });
  }

  async getAiKeyStatus(userId: string) {
    const keys = await prisma.userAiKey.findMany({ where: { userId } });
    const providers: AiProvider[] = ["gemini", "openai"];
    return providers.map((provider) => {
      const key = keys.find((k) => k.provider === provider);
      const envGemini = provider === "gemini" && !!env.GEMINI_API_KEY?.trim();
      return {
        provider,
        configured: !!key || envGemini,
        keyHint: key?.keyHint ?? (envGemini ? "...env" : null),
      };
    });
  }

  async upsertAiKey(userId: string, provider: AiProvider, apiKey: string) {
    const encryptedKey = encrypt(apiKey);
    const keyHint = getKeyHint(apiKey);
    await prisma.userAiKey.upsert({
      where: { userId_provider: { userId, provider } },
      create: { userId, provider, encryptedKey, keyHint },
      update: { encryptedKey, keyHint },
    });
    return { provider, configured: true, keyHint };
  }

  async deleteAiKey(userId: string, provider: AiProvider) {
    await prisma.userAiKey.deleteMany({ where: { userId, provider } });
  }

  async getDecryptedAiKey(userId: string, provider: AiProvider): Promise<string> {
    const record = await prisma.userAiKey.findUnique({
      where: { userId_provider: { userId, provider } },
    });
    if (record) return decrypt(record.encryptedKey);

    if (provider === "gemini" && env.GEMINI_API_KEY?.trim()) {
      return env.GEMINI_API_KEY.trim();
    }

    throw AppError.badRequest(
      `No API key configured for ${provider}. Add GEMINI_API_KEY in .env or set a key in Settings.`
    );
  }
}

export const usersService = new UsersService();
