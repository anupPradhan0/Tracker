import type { AiProvider } from "@prisma/client";
import type { AIProviderAdapter } from "./provider.interface.js";
import { GeminiProvider } from "./gemini.provider.js";
import { OpenAIProvider } from "./openai.provider.js";
import { CohereProvider } from "./cohere.provider.js";
import { AppError } from "../../common/errors/app-error.js";

export function createAIProvider(provider: AiProvider, apiKey: string): AIProviderAdapter {
  switch (provider) {
    case "gemini":
      return new GeminiProvider(apiKey);
    case "openai":
      return new OpenAIProvider(apiKey);
    case "cohere":
      return new CohereProvider(apiKey);
    default:
      throw AppError.badRequest(`Unsupported AI provider: ${provider}`);
  }
}

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastError: Error | undefined;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e as Error;
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 500 * attempt));
      }
    }
  }
  throw lastError;
}

export { withRetry };
